import { Chat } from '../models/Chat.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getChatMessages = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Chat.find({ roomId })
        .populate('senderId', 'username email avatar') 
        .sort({ createdAt: -1 }) 
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

    const totalMessages = await Chat.countDocuments({ roomId });
    const reversedMessages = messages.reverse();

    return res.status(200).json(
        new ApiResponse(200, {
            messages: reversedMessages,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalMessages / limit)
        }, "Messages fetched successfully")
    );
});

export const getMessageCount = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const count = await Chat.countDocuments({ roomId });

    return res.status(200).json(
        new ApiResponse(200, { count }, "Count fetched")
    );
});

export const saveMessage = async (roomId, senderId, message, messageType = 'text') => {
    const newMessage = await Chat.create({
        roomId,
        senderId,
        message,
        messageType
    });

    return await Chat.findById(newMessage._id)
        .populate('senderId', 'username email avatar')
        .lean();
};

export const deleteRoomChat = async (roomId) => {
    return await Chat.deleteMany({ roomId });
};