import React, { useEffect, useRef, useState } from 'react';
import { Send, Users, MessageCircle, X, Minimize2 } from 'lucide-react';
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL, withCredentials: true });

// Pass the 'socket' instance from the parent CodeEditor
const Chat = ({ roomId, userId, username, socket }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomUsersCount, setRoomUsersCount] = useState(0); // Renamed to avoid confusion with the list
    const [typing, setTyping] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [unread, setUnread] = useState(0);

    const scrollRef = useRef(null);

    // Initial message fetch
    useEffect(() => {
        if (!roomId) return;
        api.get(`/chat/${roomId}/messages`)
            .then(res => setMessages(res.data.data?.messages || []))
            .catch(() => setMessages([]));
    }, [roomId]);

    // LISTENERS ONLY - No new connection here
    useEffect(() => {
        if (!socket) return;

        const handleRoomJoined = data => setRoomUsersCount(data.roomUsers);
        const handleUserLeft = data => setRoomUsersCount(data.roomUsers);
        const handleTyping = data => data.userId !== userId && setTyping(data.isTyping ? data.username : null);
        const handleNewMessage = msg => {
            setMessages(prev => [...prev, msg]);
            if (!isOpen || isMinimized) setUnread(c => c + 1);
        };

        socket.on('room-joined', handleRoomJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('user-typing', handleTyping);
        socket.on('new-message', handleNewMessage);

        return () => {
            // Clean up listeners, but DO NOT disconnect the socket
            socket.off('room-joined', handleRoomJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('user-typing', handleTyping);
            socket.on('new-message', handleNewMessage);
        };
    }, [socket, userId, isOpen, isMinimized]);

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    useEffect(() => { if (isOpen && !isMinimized) setUnread(0); }, [isOpen, isMinimized]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;
        socket.emit('send-message', { roomId, userId, message: newMessage.trim() });
        socket.emit('typing-stop', { roomId, userId, username });
        setNewMessage('');
    };

    if (!roomId || !userId) return null;

    return (
        <>
            {!isOpen && (
                <button onClick={() => { setIsOpen(true); setIsMinimized(false); }} className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg border-2 border-white/10 hover:bg-blue-500 transition-colors">
                    <MessageCircle size={24} />
                    {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full h-5 w-5 flex items-center justify-center border-2 border-white">{unread}</span>}
                </button>
            )}

            <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 ${!isOpen ? 'scale-0 opacity-0 translate-y-10' : 'scale-100 opacity-100 translate-y-0'} ${isMinimized ? 'w-64 h-12' : 'w-80 h-96'}`}>
                <div className="bg-blue-600 text-white p-3 flex justify-between items-center cursor-pointer rounded-t-lg" onClick={() => isMinimized && setIsMinimized(false)}>
                    <div className="flex items-center gap-2 text-sm font-semibold"><Users size={16}/> Chat ({roomUsersCount})</div>
                    <div className="flex gap-2">
                        <Minimize2 size={14} className="cursor-pointer hover:text-blue-200" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}/>
                        <X size={14} className="cursor-pointer hover:text-blue-200" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}/>
                    </div>
                </div>

                {!isMinimized && (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-3">
                            {messages.map((msg, i) => {
                                const isMe = (msg.senderId?._id || msg.senderId) === userId;
                                return (
                                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>
                                            {!isMe && <span className="block text-[10px] font-bold text-blue-600 mb-0.5">{msg.senderId?.username || 'User'}</span>}
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>
                        {typing && <div className="px-3 py-1 text-[10px] text-gray-500 bg-gray-50 italic border-t border-gray-100">{typing} is typing...</div>}
                        <form onSubmit={sendMessage} className="p-2 bg-white border-t flex gap-2">
                            <input 
                                value={newMessage} 
                                onChange={(e) => { 
                                    setNewMessage(e.target.value); 
                                    socket.emit('typing-start', { roomId, userId, username }); 
                                }} 
                                placeholder="Message..." 
                                className="flex-1 bg-gray-100 rounded-full px-4 py-1.5 text-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                            <button 
                                type="submit" 
                                className="p-2 bg-blue-600 text-white rounded-full disabled:bg-gray-300 hover:bg-blue-700 transition-colors" 
                                disabled={!newMessage.trim()}
                            >
                                <Send size={14}/>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
};

export default Chat;