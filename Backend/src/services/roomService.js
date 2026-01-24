import { Room } from "../models/Room.js"

class RoomService {

    generateRoomId() {
        return Math.random().toString(36).substring(2, 10)
    }

    async createRoom(userId, username = "Anonymous") {
        return await Room.create({
            roomId: this.generateRoomId(),
            createdBy: userId,
            users: [{ userId, username }],
            isActive: true
        })
    }

    async joinRoom(roomId, userId, username = 'Anonymous') {
        const room = await Room.findOne({ roomId });
        if (!room) throw new ApiError(404, "room not found");

        const existingUser = room.users.find(u => u.userId.toString() === userId.toString())
        
        if (existingUser) {
            Object.assign(existingUser, {
                isActive: true,
                joinedAt: new Date(),
                username
            })
        } else {
            room.users.push({ userId, username });
        }
        
        room.isActive = true;
        return await room.save();
    }

    async leaveRoom(roomId, userId) {
        if (!roomId || !userId) throw new ApiError(404, "can't leave room");
        
        const room = await Room.findOne({ roomId });
        if (!room) throw new ApiError(404, "can't find room");

        const user = room.users.find(u => u.userId.toString() === userId.toString());
        
        if (user) user.isActive = false;
        
        room.isActive = room.users.some(u => u.isActive === true) 
        return await room.save()
    }

    async getUserRooms(userId) {
        if (!userId) return []
        return await Room.find({ createdBy: userId })
            .sort({ lastActivity: -1 })
    }

    async getRoomUsers(roomId) {
        const room = await Room.findOne({ roomId, isActive: true });
        
        if (!room) throw new ApiError(404, "room not found");
        return room.users.filter(u => u.isActive); 
    }

    async deleteRoom(roomId) {
        return await Room.findOneAndDelete({ roomId })
    }
}

export const roomService = new RoomService()