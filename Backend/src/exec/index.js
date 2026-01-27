import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export const handleCodeExecutionSocket = (io) => {
    const PISTON_API = process.env.PISTON_API;

    const languageConfigs = {
        javascript: { language: 'javascript', version: '18.15.0' },
        python: { language: 'python', version: '3.10.0' },
        c: { language: 'c', version: '10.2.0' },
        cpp: { language: 'cpp', version: '10.2.0' }
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
            
            socket.emit('code-execution-result', {
                output: result.run.stdout || result.run.stderr || 'No output',
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