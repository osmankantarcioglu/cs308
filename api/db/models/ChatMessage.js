const mongoose = require("mongoose");

const schema = mongoose.Schema({
    chat_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    sender_type: {
        type: String,
        enum: ["customer", "agent"],
        required: true
    },
    message: {
        type: String
    },
    attachments: [{
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    }],
    is_read: {
        type: Boolean,
        default: false
    },
    read_at: {
        type: Date
    }
}, {
    versionKey: false,
    timestamps: true
});

// Indexes
schema.index({ chat_id: 1 });
schema.index({ sender_id: 1 });
schema.index({ createdAt: 1 });

class ChatMessage extends mongoose.Model {
    static findByChat(chatId) {
        return this.find({ chat_id: chatId }).sort({ createdAt: 1 });
    }

    static findBySender(senderId) {
        return this.find({ sender_id: senderId }).sort({ createdAt: -1 });
    }

    static markAsRead(messageId) {
        return this.findByIdAndUpdate(
            messageId,
            {
                is_read: true,
                read_at: new Date()
            },
            { new: true }
        );
    }

    static findUnreadMessages(chatId) {
        return this.find({ chat_id: chatId, is_read: false });
    }
}

schema.loadClass(ChatMessage);
module.exports = mongoose.model("ChatMessage", schema, "chat_messages");

