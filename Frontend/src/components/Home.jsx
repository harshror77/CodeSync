import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { X, LogOut, Mail, User } from 'lucide-react';

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: { 'Content-Type': 'application/json' },
});

const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);
    const navigate = useNavigate();
    
    const userData = useSelector(state => state.auth.userData);
    const userId = userData?._id;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            const response = await api.post('/users/logout', {}, { withCredentials: true });
            if (response.data.success) {
                localStorage.clear();
                navigate('/login');
            }
        } catch (error) {
            console.error('Logout failed:', error);
            navigate('/login');
        }
    };

    const fetchRooms = async () => {
        if (!userId) return;
        try {
            const response = await api.get(`/rooms/getUserRooms`, { withCredentials: true });
            if (response.data.success) {
                setRooms(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const deleteRoom = async (roomId) => {
        try {
            const response = await api.delete(`/rooms/${roomId}/delete`, { withCredentials: true });
            if (response.data.success) {
                setRooms(prevRooms => prevRooms.filter(room => room.roomId !== roomId));
            }
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    };

    const confirmDelete = () => {
        if (roomToDelete) {
            deleteRoom(roomToDelete.roomId);
            setShowDeleteModal(false);
            setRoomToDelete(null);
        }
    };

    useEffect(() => {
        if(userId) fetchRooms();
    }, [userId]);

    const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-x-hidden">
            
            {/* TOP LEFT: ENLARGED PROFILE SECTION */}
            <div className="absolute top-6 left-6 z-40" ref={profileRef}>
                <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="w-28 h-28 rounded-full bg-linear-to-r from-cyan-400 to-purple-400 p-0.75 shadow-xl hover:scale-105 transition-transform duration-300"
                >
                    <div className="w-full h-full rounded-full bg-[#1a1c2e] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                        {userData?.avatar ? (
                            <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            getInitials(userData?.username)
                        )}
                    </div>
                </button>

                {showProfile && (
                    <div className="absolute top-24 left-0 w-80 bg-[#1a1c2e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-28 h-28 rounded-full bg-linear-to-r from-cyan-400 to-purple-400 p-0.75 mb-3 overflow-hidden">
                                <div className="w-full h-full rounded-full bg-[#1a1c2e] flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                                    {userData?.avatar ? (
                                        <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(userData?.username)
                                    )}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white">{userData?.username}</h3>
                            <span className="text-cyan-400 text-sm italic">Member</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-gray-300">
                                <Mail size={18} className="text-purple-400" />
                                <div className="overflow-hidden">
                                    <p className="text-[10px] uppercase text-gray-500 font-bold">Email</p>
                                    <p className="text-sm truncate">{userData?.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* TOP RIGHT: LOGOUT */}
            <div className="absolute top-6 right-6 z-30">
                <button
                    onClick={handleLogout}
                    className="group flex items-center space-x-2 px-5 py-2.5 bg-white/10 hover:bg-red-500/20 backdrop-blur-md border border-white/20 hover:border-red-500/40 rounded-full text-white transition-all duration-300 shadow-xl"
                >
                    <span className="text-sm font-medium">Logout</span>
                    <LogOut size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
            </div>

            <div className="text-center max-w-4xl mx-auto px-4 py-20">
                <div className="mb-12">
                    <h1 className="text-7xl md:text-8xl font-bold text-white mb-6">
                        Code<span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-400">Haven</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-light">
                        Collaborative coding made simple
                    </p>
                </div>

                <div className="mb-16">
                    <Link
                        to="/start"
                        className="group relative inline-block px-12 py-6 text-2xl font-semibold text-white bg-linear-to-r from-cyan-500 to-purple-600 rounded-full hover:from-cyan-400 hover:to-purple-500 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25"
                    >
                        <div className="relative flex items-center space-x-3">
                            <span>Create a Room</span>
                            <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                    </Link>
                </div>

                {rooms.length > 0 ? (
                    <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/10">
                        <div className="flex items-center justify-center space-x-3 mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-400">
                                Your Rooms
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {rooms.map(room => (
                                <div key={room._id} className="relative group bg-linear-to-br from-white/10 to-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300 transform hover:scale-105">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRoomToDelete(room); setShowDeleteModal(true); }}
                                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 transition-all z-20"
                                    >
                                        <X size={16} />
                                    </button>
                                    <Link to={`/room/${room.roomId}/${userId}`} className="block relative z-10">
                                        <div className="relative">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="w-4 h-4 bg-linear-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
                                                <span className="text-sm text-gray-400 font-medium">Room ID</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                                {room.roomId}
                                            </h3>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/10 text-white">
                        <h3 className="text-2xl font-semibold mb-3">No rooms yet</h3>
                        <p className="text-gray-400">Create your first room to start coding!</p>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1c2e] rounded-2xl p-8 border border-white/10 max-w-md w-full shadow-2xl text-center text-white">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <X size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Delete Room?</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete "{roomToDelete?.roomId}"?</p>
                        <div className="flex space-x-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-all">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;