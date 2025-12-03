const express = require('express');
const router = express.Router();
const Users = require('../db/models/Users');
const Cart = require('../db/models/Cart');
const { ValidationError, UnauthorizedError } = require('../lib/Error');
const { generateToken, authenticate } = require('../lib/auth');
const bcrypt = require('bcryptjs');
const Enum = require('../config/Enum');

/**
 * @route   POST /auth/login
 * @desc    Login user and return JWT token
 * @body    { email, password }
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        // Check if JWT_SECRET is configured
        const config = require('../config');
        if (!config.JWT.SECRET) {
            console.error('JWT_SECRET is not configured in environment variables');
            throw new Error('Server configuration error: JWT_SECRET is not set. Please set JWT_SECRET in your .env file.');
        }

        // Find user by email
        const user = await Users.findByEmail(email);

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new UnauthorizedError('Account is deactivated. Please contact administrator.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Generate JWT token
        const token = generateToken(user._id.toString());

        // Merge guest cart with user cart if session exists
        const sessionId = req.cookies?.sessionId || req.body?.sessionId;
        if (sessionId) {
            try {
                await Cart.mergeCarts(sessionId, user._id);
                console.log('Cart merged for user:', user._id);
            } catch (cartError) {
                console.error('Error merging cart on login:', cartError);
                // Don't fail login if cart merge fails
            }
        }

        // Return user data (without password) and token
        const userData = await Users.findById(user._id).select('-password');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /auth/me
 * @desc    Return current authenticated user (requires Bearer token)
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        return res.json({ success: true, data: req.user });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /auth/register
 * @desc    Register a new customer (public endpoint)
 * @body    { email, password, first_name, last_name, phone_number?, taxID?, home_address? }
 */
router.post('/register', async (req, res, next) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            phone_number,
            taxID,
            home_address
        } = req.body;

        if (!email || !password || !first_name || !last_name) {
            throw new ValidationError('Missing required fields: email, password, first_name, last_name');
        }

        // Check if email already exists
        const existingUser = await Users.findByEmail(email);
        if (existingUser) {
            throw new ValidationError('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer user
        const user = new Users({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            first_name,
            last_name,
            role: Enum.USER_ROLES.CUSTOMER, // Always customer for public registration
            is_active: true // New registrations are active by default
        });

        // Add optional fields if provided
        if (phone_number) user.phone_number = phone_number;
        if (taxID) user.taxID = taxID;
        if (home_address) user.home_address = home_address;

        await user.save();

        // Generate token
        const token = generateToken(user._id.toString());

        const userData = await Users.findById(user._id).select('-password');

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            const dupField = Object.keys(error.keyPattern || {})[0] || 'field';
            next(new ValidationError(`${dupField} already exists`));
        } else {
            next(error);
        }
    }
});

module.exports = router;

