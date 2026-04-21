import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export const handleCodeExecutionSocket = (io) => {
    const PISTON_API = process.env.PISTON_API;
    const languageConfigs = {
        javascript: { language: 'javascript', version: '*' },
        python: { language: 'python', version: '*' },
        c: { language: 'c', version: '*' },
        cpp: { language: 'cpp', version: '*' }
    };

    const executeCode = async (socket, code, language, sessionId) => {
        try {
            const config = languageConfigs[language];
            if (!config) throw new Error(`Unsupported language: ${language}`);

            socket.emit('code-execution-progress', { status: '🚀 Executing...', sessionId });

            const response = await fetch(PISTON_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: config.language,
                    version: config.version,
                    files: [{ content: code }]
                })
            });

            const result = await response.json();
            
            // 1. Check for API-level errors
            if (result.message) {
                throw new Error(`API Error: ${result.message}`);
            }

            // 2. THE FIX: Handle C++ Compilation Errors
            // If compilation fails, Piston returns 'compile' but omits 'run'
            if (result.compile && result.compile.code !== 0) {
                return socket.emit('code-execution-result', {
                    output: result.compile.output || result.compile.stderr || 'Compilation failed',
                    success: false,
                    sessionId,
                    timestamp: new Date().toISOString()
                });
            }

            // 3. Handle standard execution (JS, Python, or successfully compiled C++)
            if (!result.run) {
                throw new Error('Invalid response from execution server. No run data.');
            }
            
            socket.emit('code-execution-result', {
                // Use .output first, as it safely combines stdout and stderr
                output: result.run.output || result.run.stdout || result.run.stderr || 'No output',
                success: result.run.code === 0,
                sessionId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            socket.emit('code-execution-error', {
                message: error.message || 'Execution failed',
                sessionId
            });
        }
    };

    io.of('/code-execution').on('connection', (socket) => {
        socket.on('execute-code', async ({ code, language, sessionId }) => {
            if (!code?.trim()) {
                return socket.emit('code-execution-error', { message: '❌ No code provided' });
            }
            await executeCode(socket, code, language, sessionId);
        });
    });
};