const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const Chat = require('../db/models/Chat');
const ChatMessage = require('../db/models/ChatMessage');
const Order = require('../db/models/Order');
const Delivery = require('../db/models/Delivery');
const Wishlist = require('../db/models/Wishlist');
const { optionalAuthenticate, authenticate } = require('../lib/auth');
const { requireSupportAgent } = require('../lib/middleware');
const { ValidationError, NotFoundError, ForbiddenError } = require('../lib/Error');
const Enum = require('../config/Enum');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'chat');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const validateCustomerAccess = (chat, req, sessionId) => {
    if (!chat) {
        throw new NotFoundError('Chat not found');
    }

    // Check if user is authenticated and is a support agent
    if (req.user) {
        const userRole = req.user.role;
        const isSupportAgent = userRole === Enum.USER_ROLES.SUPPORT_AGENT;
        
        // Support agents can access any chat
        if (isSupportAgent) {
            return; // Authorized
        }
        
        // If user is authenticated, check if they own the chat
        // Handle both populated and non-populated user_id
        let chatUserId = null;
        if (chat.user_id) {
            // Check if user_id is populated (object) or just an ID (string/ObjectId)
            if (typeof chat.user_id === 'object' && chat.user_id._id) {
                chatUserId = chat.user_id._id.toString();
            } else if (typeof chat.user_id === 'object' && chat.user_id.toString) {
                chatUserId = chat.user_id.toString();
            } else if (typeof chat.user_id === 'string') {
                chatUserId = chat.user_id;
            }
        }
        
        const userUserId = req.user._id ? req.user._id.toString() : null;
        const isChatOwner = chatUserId && userUserId && chatUserId === userUserId;
        if (isChatOwner) {
            return; // Authorized
        }
    }
    
    // For guest users, check session_id match
    if (!req.user && sessionId && chat.session_id) {
        const isGuestOwner = chat.session_id === sessionId;
        if (isGuestOwner) {
            return; // Authorized
        }
    }

    // If we reach here, user is not authorized
    throw new ForbiddenError('You are not authorized to access this chat');
};

const saveAttachments = async (attachments = []) => {
    if (!attachments || attachments.length === 0) {
        return [];
    }

    const processed = await Promise.all(
        attachments.map(async (attachment) => {
            if (attachment.path) {
                return attachment;
            }

            if (!attachment.data) {
                return null;
            }

            const { filename = 'attachment', mimetype, data, size } = attachment;
            const extension =
                path.extname(filename) ||
                (mimetype ? `.${mime.extension(mimetype) || ''}` : '');
            const safeName = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${extension || ''}`;
            const filePath = path.join(uploadDir, safeName);

            const base64Data = data.includes('base64,')
                ? data.split(';base64,').pop()
                : data;

            await fs.promises.writeFile(filePath, base64Data, { encoding: 'base64' });

            return {
                filename,
                path: `/uploads/chat/${safeName}`,
                mimetype,
                size
            };
        })
    );

    return processed.filter(Boolean);
};

router.post('/start', optionalAuthenticate, async function(req, res, next) {
    try {
        const { session_id, customer_email, customer_name, message, attachments = [] } = req.body;

        if (!req.user && !session_id) {
            throw new ValidationError('Session ID is required for guest chats');
        }

        if (!req.user && !customer_email) {
            throw new ValidationError('Email is required to start a chat');
        }

        if (!message && (!attachments || attachments.length === 0)) {
            throw new ValidationError('Please provide a message or an attachment');
        }

        const chatData = {
            user_id: req.user?._id,
            session_id: req.user ? undefined : session_id,
            customer_email: req.user ? req.user.email : customer_email,
            customer_name: req.user ? `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() : customer_name,
        };

        const chat = new Chat(chatData);
        await chat.save();

        const storedAttachments = await saveAttachments(attachments);

        const messagePayload = await ChatMessage.create({
            chat_id: chat._id,
            sender_id: req.user?._id,
            sender_type: 'customer',
            message,
            attachments: storedAttachments
        });

        await Chat.updateLastMessage(chat._id);

        res.status(201).json({
            success: true,
            data: {
                chat,
                message: messagePayload
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/queue', authenticate, requireSupportAgent, async function(req, res, next) {
    try {
        const chats = await Chat.find({ status: Enum.CHAT_STATUS.ACTIVE })
            .populate('user_id', 'first_name last_name email')
            .sort({ last_message_at: -1 })
            .lean();

        const enrichedChats = await Promise.all(
            chats.map(async (chat) => {
                const lastMessage = await ChatMessage.findOne({ chat_id: chat._id })
                    .sort({ createdAt: -1 })
                    .lean();

                return {
                    ...chat,
                    last_message_preview: lastMessage?.message || '',
                    last_message_at: lastMessage?.createdAt || chat.updatedAt
                };
            })
        );

        res.json({
            success: true,
            data: enrichedChats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /chats/claimed
 * @desc    Get chats claimed by the current agent
 */
router.get('/claimed', authenticate, requireSupportAgent, async function(req, res, next) {
    try {
        const chats = await Chat.find({ 
            claimed_by: req.user._id,
            status: { $in: [Enum.CHAT_STATUS.CLAIMED, Enum.CHAT_STATUS.ACTIVE] }
        })
            .populate('user_id', 'first_name last_name email')
            .populate('claimed_by', 'first_name last_name email')
            .sort({ last_message_at: -1 })
            .lean();

        const enrichedChats = await Promise.all(
            chats.map(async (chat) => {
                const lastMessage = await ChatMessage.findOne({ chat_id: chat._id })
                    .sort({ createdAt: -1 })
                    .lean();

                return {
                    ...chat,
                    last_message_preview: lastMessage?.message || '',
                    last_message_at: lastMessage?.createdAt || chat.updatedAt
                };
            })
        );

        res.json({
            success: true,
            data: enrichedChats
        });
    } catch (error) {
        next(error);
    }
});

router.get('/me/latest', optionalAuthenticate, async function(req, res, next) {
    try {
        const sessionId = req.query.session_id;
        
        // Build query based on whether user is authenticated or guest
        const query = {
            status: { $ne: Enum.CHAT_STATUS.CLOSED }
        };

        if (req.user) {
            // Authenticated user: find by user_id
            query.user_id = req.user._id;
        } else if (sessionId) {
            // Guest user: find by session_id
            query.session_id = sessionId;
        } else {
            // No user and no session_id - return null
            return res.json({
                success: true,
                data: null
            });
        }

        const chat = await Chat.findOne(query).sort({ updatedAt: -1 });

        if (!chat) {
            return res.json({
                success: true,
                data: null
            });
        }

        const messages = await ChatMessage.findByChat(chat._id);

        res.json({
            success: true,
            data: {
                chat,
                messages
            }
        });
    } catch (error) {
        next(error);
    }
});

router.get('/history', optionalAuthenticate, async function(req, res, next) {
    try {
        const sessionId = req.query.session_id;

        if (!req.user && !sessionId) {
            throw new ValidationError('session_id is required for guest users');
        }

        const filter = {};

        if (req.user) {
            filter.user_id = req.user._id;
        } else {
            filter.session_id = sessionId;
        }

        const chats = await Chat.find(filter).sort({ updatedAt: -1 });

        const histories = await Promise.all(
            chats.map(async (chat) => {
                const messages = await ChatMessage.findByChat(chat._id);
                return {
                    chat,
                    messages
                };
            })
        );

        res.json({
            success: true,
            data: histories
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/claim', authenticate, requireSupportAgent, async function(req, res, next) {
    try {
        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            throw new NotFoundError('Chat not found');
        }

        if (chat.status !== Enum.CHAT_STATUS.ACTIVE && chat.claimed_by?.toString() !== req.user._id.toString()) {
            throw new ValidationError('Chat already claimed by another agent');
        }

        chat.status = Enum.CHAT_STATUS.CLAIMED;
        chat.claimed_by = req.user._id;
        chat.claimed_at = new Date();
        await chat.save();

        res.json({
            success: true,
            data: chat
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/messages', optionalAuthenticate, async function(req, res, next) {
    try {
        const { session_id } = req.query;
        const authHeader = req.headers.authorization;
        const hasToken = authHeader && authHeader.startsWith('Bearer ');
        
        const chat = await Chat.findById(req.params.id)
            .populate('user_id', 'first_name last_name email');

        if (!chat) {
            throw new NotFoundError('Chat not found');
        }

        // Always check token for support agents and customers, regardless of req.user
        // This ensures we catch users even if optionalAuthenticate failed
        if (hasToken && !req.user) {
            try {
                const jwt = require('jsonwebtoken');
                const config = require('../config');
                const Users = require('../db/models/Users');
                const token = authHeader.substring(7);
                
                // Try to verify the token
                let decoded;
                try {
                    decoded = jwt.verify(token, config.JWT.SECRET);
                } catch (verifyError) {
                    // Token is invalid or expired - skip authentication
                    decoded = null;
                }
                
                if (decoded) {
                    const user = await Users.findById(decoded.userId).select('-password');
                    
                    if (user && user.is_active) {
                        // Set req.user for validation
                        req.user = user;
                        
                        // Support agents can access any chat
                        if (user.role === Enum.USER_ROLES.SUPPORT_AGENT) {
                            const messages = await ChatMessage.findByChat(chat._id);
                            return res.json({
                                success: true,
                                data: {
                                    chat,
                                    messages
                                }
                            });
                        }
                    }
                }
            } catch (authError) {
                // Error during authentication - continue to normal validation
            }
        }
        
        // Check if user is a support agent (from optionalAuthenticate or manual auth)
        if (req.user && req.user.role === Enum.USER_ROLES.SUPPORT_AGENT) {
            // Support agents can access any chat - skip validation
            const messages = await ChatMessage.findByChat(chat._id);
            return res.json({
                success: true,
                data: {
                    chat,
                    messages
                }
            });
        }

        // For customers and guests, validate access normally
        validateCustomerAccess(chat, req, session_id);

        const messages = await ChatMessage.findByChat(chat._id);

        res.json({
            success: true,
            data: {
                chat,
                messages
            }
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/messages', optionalAuthenticate, async function(req, res, next) {
    try {
        const { sender_type, message, attachments = [], session_id } = req.body;

        if (!sender_type || !['customer', 'agent'].includes(sender_type)) {
            throw new ValidationError('Invalid sender type');
        }

        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            throw new NotFoundError('Chat not found');
        }

        if (sender_type === 'agent') {
            if (!req.user || req.user.role !== Enum.USER_ROLES.SUPPORT_AGENT) {
                throw new ForbiddenError('Only support agents can send agent messages');
            }

            if (!chat.claimed_by) {
                chat.claimed_by = req.user._id;
                chat.claimed_at = new Date();
            }
        } else {
            validateCustomerAccess(chat, req, session_id);
        }

        if (!message && attachments.length === 0) {
            throw new ValidationError('Message or attachment is required');
        }

        const storedAttachments = await saveAttachments(attachments);

        const chatMessage = await ChatMessage.create({
            chat_id: chat._id,
            sender_id: sender_type === 'agent' ? req.user?._id : chat.user_id,
            sender_type,
            message,
            attachments: storedAttachments
        });

        await Chat.updateLastMessage(chat._id);

        res.status(201).json({
            success: true,
            data: chatMessage
        });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/context', authenticate, requireSupportAgent, async function(req, res, next) {
    try {
        const Cart = require('../db/models/Cart');
        
        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            throw new NotFoundError('Chat not found');
        }

        if (!chat.user_id) {
            return res.json({
                success: true,
                data: {
                    orders: [],
                    deliveries: [],
                    wishlist: [],
                    cart: null
                }
            });
        }

        const [orders, deliveries, wishlistDoc, cartDoc] = await Promise.all([
            Order.find({ customer_id: chat.user_id })
                .populate('items.product_id', 'name images')
                .sort({ order_date: -1 })
                .limit(5)
                .lean(),
            Delivery.find({ customer_id: chat.user_id })
                .populate('product_id', 'name images')
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Wishlist.findOne({ user_id: chat.user_id })
                .populate('products.product_id', 'name images price')
                .lean(),
            Cart.findOne({ user_id: chat.user_id })
                .populate('items.product_id', 'name images price quantity')
                .lean()
        ]);

        res.json({
            success: true,
            data: {
                orders,
                deliveries,
                wishlist: wishlistDoc?.products || [],
                cart: cartDoc || null
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

