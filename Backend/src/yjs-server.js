import {Server} from '@hocuspocus/server'
import {File} from './models/File.js'

const yjsServer = new Server({
    port:1234,
    name:'code-sync',
    debounce:200,


    async onChange(data){
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
})

export default yjsServer;