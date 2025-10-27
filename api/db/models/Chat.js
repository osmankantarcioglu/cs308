const mongoose = require("mongoose");
const Enum = require("../../config/Enum");

const schema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    session_id: {
        type: String // For guest users
    },
    customer_email: {
        type: String
    },
    customer_name: {
        type: String
    },
    status: {
        type: String,
        enum: [
            Enum.CHAT_STATUS.ACTIVE,
            Enum.CHAT_STATUS.CLAIMED,
            Enum.CHAT_STATUS.CLOSED
        ],
        default: Enum.CHAT_STATUS.ACTIVE
    },
    claimed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    claimed_at: {
        type: Date
    },
    closed_at: {
        type: Date
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: {
        type: String
    },
    last_message_at: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    timestamps: true
});

// Indexes
schema.index({ status: 1 });
schema.index({ user_id: 1 });
schema.index({ claimed_by: 1 });
schema.index({ last_message_at: -1 });

class Chat extends mongoose.Model {
    static findActiveChats() {
        return this.find({ status: Enum.CHAT_STATUS.ACTIVE }).sort({ last_message_at: -1 });
    }

    static findByUser(userId) {
        return this.find({ user_id: userId }).sort({ createdAt: -1 });
    }

    static findByAgent(agentId) {
        return this.find({ 
            claimed_by: agentId,
            status: { $in: [Enum.CHAT_STATUS.CLAIMED, Enum.CHAT_STATUS.ACTIVE] }
        }).sort({ last_message_at: -1 });
    }

    static claimChat(chatId, agentId) {
        return this.findByIdAndUpdate(
            chatId,
            {
                status: Enum.CHAT_STATUS.CLAIMED,
                claimed_by: agentId,
                claimed_at: new Date()
            },
            { new: true }
        );
    }

    static closeChat(chatId) {
        return this.findByIdAndUpdate(
            chatId,
            {
                status: Enum.CHAT_STATUS.CLOSED,
                closed_at: new Date()
            },
            { new: true }
        );
    }

    static updateLastMessage(chatId) {
        return this.findByIdAndUpdate(
            chatId,
            { last_message_at: new Date() },
            { new: true }
        );
    }
}

schema.loadClass(Chat);
module.exports = mongoose.model("Chat", schema, "chats");

