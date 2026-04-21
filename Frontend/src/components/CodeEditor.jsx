import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { yCollab } from 'y-codemirror.next';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import axios from 'axios';
import FileExplorer from './FileSidebar.jsx';
import Chat from './Chat.jsx';
import { Play, Save, LogOut, Copy, Check, Terminal as TerminalIcon, Users } from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_BACKEND_URL, withCredentials: true });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

const CodeEditor = () => {
    const { roomId, userId } = useParams();
    const navigate = useNavigate();
    const userInfo = useSelector((state) => state.auth.userData);

    const editorRef = useRef(null);
    const viewRef = useRef(null);
    const providerRef = useRef(null);
    const ytextRef = useRef(null);
    const socketRef = useRef(null);
    const execSocketRef = useRef(null); // Added ref for execution socket

    const [currentFile, setCurrentFile] = useState(null);
    const [language, setLanguage] = useState('javascript');
    const [terminal, setTerminal] = useState([]);
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [status, setStatus] = useState({ executing: false, saving: false, copied: false });
    const [roomUsers, setRoomUsers] = useState([]);

    const log = (msg, type = 'info') => {
        setTerminal(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_BACKEND_URL.replace('/api', '');
        
        // Main Room Socket
        const socket = io(socketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5
        });
        socketRef.current = socket;

        // Code Execution Socket (Matching your backend index.js)
        const execSocket = io(`${socketUrl}/code-execution`, {
            transports: ['websocket'],
        });
        execSocketRef.current = execSocket;

        socket.on('connect', () => {
            socket.emit('join-room', { roomId, userId, username: userInfo?.username });
            setIsSocketReady(true);
        });

        socket.on('room-joined', (data) => {
            setRoomUsers(data.users || []);
        });

        socket.on('user-connected', (newUser) => {
            setRoomUsers((prev) => {
                const isDuplicate = prev.some(u => u.userId === newUser.userId);
                if (isDuplicate) return prev;
                return [...prev, newUser];
            });
        });

        socket.on('user-left', (data) => {
            setRoomUsers((prev) => prev.filter(u => u.userId !== data.userId));
        });

        // Listeners for Code Execution
        execSocket.on('code-execution-progress', (data) => {
            log(data.status, 'system');
        });

        execSocket.on('code-execution-result', (data) => {
            log(data.output, data.success ? 'output' : 'error');
            setStatus(s => ({ ...s, executing: false }));
        });

        execSocket.on('code-execution-error', (data) => {
            log(data.message, 'error');
            setStatus(s => ({ ...s, executing: false }));
        });

        return () => {
            socket.disconnect();
            execSocket.disconnect();
        };
    }, [roomId, userId, userInfo?.username]);

    const setupSync = (docName, initialContent) => {
        if (providerRef.current) providerRef.current.destroy();
        if (viewRef.current) viewRef.current.destroy();

        const ydoc = new Y.Doc();
        const provider = new HocuspocusProvider({
            url: import.meta.env.VITE_BACKEND_WS || 'ws://localhost:1234',
            name: docName,
            document: ydoc,
        });

        const ytext = ydoc.getText('codemirror');
        ytextRef.current = ytext;

        provider.on('synced', () => {
            if (ytext.toString().length === 0 && initialContent) {
                ytext.insert(0, initialContent);
            }
        });

        const state = EditorState.create({
            doc: ytext.toString(),
            extensions: [
                basicSetup,
                language === 'python' ? python() : language === 'cpp' ? cpp() : javascript(),
                yCollab(ytext, provider.awareness),
                EditorView.theme({ "&": { height: "100%" }, ".cm-scroller": { overflow: "auto" } }, { dark: true })
            ]
        });

        viewRef.current = new EditorView({ state, parent: editorRef.current });
        providerRef.current = provider;
    };

    const handleFileSelect = async (file) => {
        if (currentFile?.path === file.path) return;
        setCurrentFile(file);
        try {
            const { data } = await api.get(`/files/${roomId}/content`, {
                params: { path: file.path }
            });
            setupSync(`${roomId}-${file.path}`, data.content || '');
            log(`Opened ${file.name}`);
        } catch (err) {
            log(`Error loading file`, 'error');
        }
    };

    const onSave = async () => {
        if (!currentFile || status.saving) return;
        setStatus(s => ({ ...s, saving: true }));
        try {
            const content = ytextRef.current?.toString() || '';
            await api.put(`/files/${roomId}/update/${encodeURIComponent(currentFile.path)}`, { content, language });
            log(`Saved ${currentFile.name}`, 'success');
        } catch (err) {
            log(`Save failed`, 'error');
        } finally {
            setStatus(s => ({ ...s, saving: false }));
        }
    };

    const onRun = () => {
        if (!execSocketRef.current) return;
        
        setStatus(s => ({ ...s, executing: true }));
        log(`Preparing to run ${language}...`, 'system');

        const code = ytextRef.current?.toString();
        
        // Use Socket instead of Axios HTTP request
        execSocketRef.current.emit('execute-code', {
            code: code,
            language: language,
            sessionId: socketRef.current?.id || userId
        });
    };

    return (
        <div className="flex flex-col h-screen bg-[#09090b] text-zinc-300 font-sans relative overflow-hidden">
            <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090b] shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-white font-bold tracking-tight text-lg">CodeHaven <span className="text-blue-500">IDE</span></span>
                    <div className="h-4 w-px bg-zinc-700" />
                    <button onClick={() => { navigator.clipboard.writeText(roomId); setStatus(s => ({ ...s, copied: true })); setTimeout(() => setStatus(s => ({ ...s, copied: false })), 2000); }}
                        className="flex items-center gap-2 text-xs bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800 hover:bg-zinc-800 transition">
                        {status.copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        <span className="font-mono">{roomId}</span>
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-zinc-900 border border-zinc-800 text-xs rounded-md px-2 py-1.5 outline-none cursor-pointer">
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                    </select>
                    <button onClick={onSave} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 transition" title="Save"><Save size={18} /></button>
                    <button onClick={onRun} disabled={status.executing} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-sm font-medium transition disabled:opacity-50">
                        <Play size={14} /> {status.executing ? 'Running...' : 'Run'}
                    </button>
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-red-500/10 text-red-500 rounded-md transition"><LogOut size={18} /></button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <div className="w-96 border-r border-zinc-800 flex flex-col bg-[#09090b] shrink-0">
                    <div className="flex-1 overflow-y-auto">
                        <FileExplorer roomId={roomId} onFileSelect={handleFileSelect} />
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-[#0c0c0e] shrink-0">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 flex items-center gap-2 mb-3">
                            <Users size={12} /> Active Users ({roomUsers.length})
                        </h3>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {roomUsers.map((user) => (
                                <div key={user.userId} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[11px] font-medium text-zinc-300">
                                        {user.username} {user.userId === userId && "(You)"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative shrink-0 z-40">
                        <Chat roomId={roomId} userId={userId} username={userInfo?.username} socket={socketRef.current} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col bg-[#0c0c0e] min-w-0">
                    {currentFile ? (
                        <>
                            <div className="flex-1 relative">
                                <div className="absolute inset-0" ref={editorRef} />
                            </div>
                            <div className="h-56 border-t border-zinc-800 bg-[#09090b] flex flex-col shrink-0">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                                    <span className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"><TerminalIcon size={12}/> Console</span>
                                    <button onClick={() => setTerminal([])} className="text-[10px] hover:text-white transition">Clear</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
                                    {terminal.map((t, i) => (
                                        <div key={i} className="flex gap-2">
                                            <span className="text-zinc-600">[{t.time}]</span>
                                            <span className={t.type === 'error' ? 'text-red-400' : t.type === 'output' ? 'text-green-400' : 'text-blue-400'}>
                                                {t.msg}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                            <div className="p-4 rounded-full bg-zinc-900 mb-4"><Save size={32} /></div>
                            <h2 className="text-xl font-medium text-white mb-2">Ready to Code</h2>
                            <p>Select a file from the explorer to start collaborating.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CodeEditor;