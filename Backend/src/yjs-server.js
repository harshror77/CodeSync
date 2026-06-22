import { Server } from '@hocuspocus/server';
import { File } from './models/File.js';
import connectDB from './db/index.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

connectDB().catch(e => console.log(`DB Error: ${e}`));

const yjsServer = new Server({
    port: process.env.YJS_PORT || 1234, 
    name: 'code-sync',
    debounce: 200,

    async onChange(data) {
        const [roomId, filePath] = data.documentName.split('::')
        if (!filePath) return;
        try {
            const currContent = data.document.getText('codemirror').toString();
            if (currContent.length === 0) {
                console.warn(`Skipping save — empty content for ${roomId}::${filePath}`);
                return;
            }
            await File.findOneAndUpdate(
                { roomId, path: filePath },
                { content: currContent },
                { upsert: false }
            );
        } catch (e) {
            console.error(`Save Error: ${e.message}`);
        }
    }
});

yjsServer.listen().then(({ port }) => {
    console.log(`YJS Microservice running on port ${port}`);
});