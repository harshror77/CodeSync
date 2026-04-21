import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export const handleCodeExecutionSocket = (io) => {
    const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
    const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;

    const languageConfigs = {
        javascript: { language: 'nodejs', versionIndex: '4' },
        python: { language: 'python3', versionIndex: '4' },
        c: { language: 'c', versionIndex: '4' },
        cpp: { language: 'cpp17', versionIndex: '1' }
    };

    const executeCode = async (socket, code, language, sessionId) => {
        try {
            const config = languageConfigs[language];
            if (!config) throw new Error(`Unsupported language: ${language}`);

            socket.emit('code-execution-progress', { status: 'Executing...', sessionId });

            const body = JSON.stringify({
                script: code,
                language: config.language,
                versionIndex: config.versionIndex,
                clientId: JDOODLE_CLIENT_ID,
                clientSecret: JDOODLE_CLIENT_SECRET
            });

            const response = await fetch("https://api.jdoodle.com/v1/execute", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });

            const result = await response.json();

            if (response.status !== 200) {
                throw new Error(result.error || 'JDoodle API Error');
            }

            socket.emit('code-execution-result', {
                output: result.output || 'No output',
                success: true, 
                sessionId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error("JDoodle Error:", error.message);
            socket.emit('code-execution-error', {
                message: error.message || 'Execution failed',
                sessionId
            });
        }
    };

    io.of('/code-execution').on('connection', (socket) => {
        socket.on('execute-code', async ({ code, language, sessionId }) => {
            if (!code?.trim()) {
                return socket.emit('code-execution-error', { message: ' No code provided' });
            }
            await executeCode(socket, code, language, sessionId);
        });
    });
};