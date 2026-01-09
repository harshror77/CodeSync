import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    roomId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    messageType: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    }
},{ timestamps: true });

chatSchema.index({ roomId: 1, createdAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);
