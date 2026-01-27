import {saveMessage} from './controllers/chat.controller.js'
import { roomService } from './services/room.service.js';
export const handleSocket = (io)=>{
    io.on('connection',(socket)=>{
        socket.on('join-room',async({roomId,userId,username})=>{
            socket.roomId = roomId;
            socket.userId = userId;
            socket.username = username;
            socket.join(roomId);

            const sockets = await io.in(roomId).fetchSockets();
            const uniqueUsers = [];
            const seenIds = new Set();

            sockets.forEach(s => {
                if(s.userId && !seenIds.has(s.userId)){
                    seenIds.add(s.userId);
                    uniqueUsers.push({userId:s.userId, username: s.username})
                }
            });

            io.to(roomId).emit('room-joined',{
                roomId,
                roomUsers:uniqueUsers.length,
                users:uniqueUsers
            });
            socket.to(roomId).emit('user-connected',{userId,username});
        })
        socket.on('send-message',async({roomId,userId,message})=>{
            const savedMessage = await saveMessage(roomId,userId,message.trim());
            io.to(roomId).emit('new-message',savedMessage);
        })
        socket.on('typing-start',({roomId,userId,username})=>{
            socket.to(roomId).emit('user-typing',{userId,username,isTyping:true})
        })
        socket.on('typing-stop',({roomId,userId,username})=>{
            socket.to(roomId).emit('user-typing',{userId,username,isTyping:false})
        })
        socket.on('leave-room',({roomId})=>{
            socket.leave(roomId);
            socket.roomId = null;
        })
        socket.on('disconnect',async()=>{
            if(socket.roomId && socket.userId){
                await roomService.leaveRoom(socket.roomId,socket.userId);
                io.to(socket.roomId).emit('user-left',{
                    userId:socket.userId,
                    roomUsers:( await io.in(socket.roomId).fetchSockets()).length
                });
            }
        })
    })
}