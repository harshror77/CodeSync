import {Server} from '@hocuspocus/server'
import {File} from './models/File.js'

const yjsServer = new Server({
    port:1234,
    name:'code-sync',
    debounce:200,

    async onLoadDocument(data){
        const [roomId,filePath] = data.documentName.split('::')
        if(!filePath) return data.document;
        try{
            const file = await File.findOne({roomId,path:filePath});
            if(file && file.content){
                data.document.getText('codemirror').insert(0,file.content);
            }
        }catch(e){
            console.error(`Load Error: ${e.message}`)
        }
        return data.document;
    },

    async onChange(data){
        const [roomId,filePath] = data.documentName.split('::')
        if(!filePath) return;
        try{
            const currContent = data.document.getText('codemirror').toString();
            await File.findOneAndUpdate(
                {roomId,path:filePath},
                {content:currContent},
                {upsert:false}
            );
        }catch(e){
            console.error(`Save Error: ${e.message}`);
        }
    }
})

export default yjsServer;