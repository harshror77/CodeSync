import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {server} from './app.js'
import yjsServer from './yjs-server.js';
dotenv.config({path:'./.env'});

connectDB()
.then(()=>{
    const PORT = process.env.PORT || 7000;
    server.listen(PORT,()=>{
        console.log(`server running on port ${PORT}`);
    })
    yjsServer.listen().then(()=>{
        console.log(`yjsServer running on localhost:1234`)
    })
})
.catch((e)=>{
    console.log(`mongodb connection error ${e}`);
})