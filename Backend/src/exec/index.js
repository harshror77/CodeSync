import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { RateLimiterClient } from '@harshror77/rate-limiter-sdk';
dotenv.config();

const rateLimiter = new RateLimiterClient({
    serviceUrl: process.env.RATE_LIMITER_SERVICE_URL || 'http://localhost:3000',
    apiKey: process.env.RATE_LIMITER_API_KEY || 'free-test-key'
});

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
            try {
                const userIp = socket.handshake.address || socket.handshake.headers['x-forwarded-for'] || '127.0.0.1';
                const limitResult = await rateLimiter.check({ ip: userIp });

                if (!limitResult.allowed) {
                    const retrySecs = Math.ceil((limitResult.resetAt - Date.now()) / 1000);
                    return socket.emit('code-execution-error', { 
                        message: `Rate limit exceeded. Please try again in ${retrySecs} seconds.`,
                        sessionId 
                    });
                }
            } catch (err) {
                console.warn('[RateShield] Warning: Service unreachable, failing open.');
            }

            await executeCode(socket, code, language, sessionId);
        });
    });
};