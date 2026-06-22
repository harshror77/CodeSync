import { Router } from "express"
import { verifyJWT } from "../middleware/auth.js"
import {
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    getRoomUsers,
    getUserRooms,
} from "../controllers/room.controller.js"
import {strictRateLimit} from '../middleware/RateLimiter.js'

const router = Router()
router.use(verifyJWT) 

router.route('/create').post(strictRateLimit,createRoom)
router.route('/getUserRooms').get(getUserRooms)
router.route('/:roomId/join').post(joinRoom)
router.route('/:roomId/leave').post(leaveRoom)
router.route('/:roomId/delete').delete(deleteRoom)
router.route('/:roomId/users').get(getRoomUsers) 

export default router;