import express from "express"
import http from "http"
import cors from "cors"
import cookieParser from 'cookie-parser'
import dotenv from "dotenv"
import {Server as SocketServer} from 'socket.io'
import {handleSocket} from './socket.js'

dotenv.config({path:'./.env'});

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server,{
    cors:{
        origin:process.env.CORS_ORIGIN,
        methods:['GET','POST'],
        credentials:true
    }
})
app.set('io',io);
handleSocket(io);

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser());

import roomRoutes from './routes/room.routes.js'
import userRoutes from './routes/user.routes.js'
import fileRoutes from './routes/file.routes.js'

app.use('/api/rooms',roomRoutes);
app.use('/api/users',userRoutes);
app.use('/api/files',fileRoutes)

export {server}
