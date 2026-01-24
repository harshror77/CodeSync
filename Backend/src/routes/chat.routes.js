import {Router } from "express"
import { verifyJWT } from "../middleware/auth.js"
import {getMessageCount,getChatMessages} from "../controllers/chat.controller.js"

const router = Router()
router.use(verifyJWT)

router.route('/:roomId/messages').get(getChatMessages)
router.route('/:roomId/count').get(getMessageCount)

export default router;