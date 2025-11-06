// api/routes/support.js
const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// --- Sprint-1 in-memory data (replace with Mongo in later sprint) ---
const conversations = [
  { id: 'conv_1', customerId: 'c_1', lastMessage: 'Hi there', status: 'open', updatedAt: new Date().toISOString() },
];
const messages = { conv_1: [] };
const customers = {
  c_1: {
    profile: { id: 'c_1', name: 'Demo User', email: 'demo@example.com' },
    orders: [{ id: 'o_1', total: 199.9, status: 'shipped' }],
    cart: { items: [{ sku: 'sku_1', name: 'Sample', qty: 1, price: 49.9 }], subtotal: 49.9 },
  },
};

// List conversations
router.get('/conversations', (_req, res) => res.json(conversations));

// Messages in a conversation
router.get('/conversations/:id/messages', (req, res) => {
  res.json(messages[req.params.id] ?? []);
});

// Customer context (profile/orders/cart)
router.get('/customers/:customerId/context', (req, res) => {
  res.json(customers[req.params.customerId] ?? {});
});

// Upload attachment
router.post('/upload', upload.single('file'), (req, res) => {
  const f = req.file;
  res.json({ id: f.filename, name: f.originalname, url: `/files/${f.filename}`, mime: f.mimetype });
});

// Create message + broadcast via Socket.IO
router.post('/message', (req, res) => {
  const io = req.app.get('io');
  const { conversationId, text, attachments = [], senderType = 'agent', senderId = 'agent_1' } = req.body;

  const msg = {
    id: 'msg_' + Math.random().toString(36).slice(2),
    conversationId,
    senderType,
    senderId,
    text,
    attachments,
    createdAt: new Date().toISOString(),
  };

  if (!messages[conversationId]) messages[conversationId] = [];
  messages[conversationId].push(msg);

  const conv = conversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.lastMessage = text || (attachments[0]?.name ?? 'Attachment');
    conv.updatedAt = msg.createdAt;
  }

  if (io) io.emit('message:new', msg);
  res.json({ ok: true, message: msg });
});

module.exports = router;