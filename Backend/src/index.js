import dotenv from 'dotenv'
import {server} from './app.js'
import connectDB from './db/index.js'

dotenv.config({path:'./.env'});

connectDB()
.then(()=>{
    const PORT = process.env.PORT || 7000;
    server.listen(PORT,()=>{
        console.log(`server running on port ${PORT}`);
    })
})
.catch((e)=>{
    console.log(`mongodb connection error ${e}`);
})