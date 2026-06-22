import { Router } from "express"
import { registerUser, loginUser, logoutUser, changePassword, updateProfile, getCurrentUser, deleteAccount, refreshAccessToken } from "../controllers/user.controller.js"
import { verifyJWT } from './../middleware/auth.js';
import { strictRateLimit } from "../middleware/RateLimiter.js"; 

const router = Router();

router.route('/register').post(strictRateLimit, registerUser);
router.route('/login').post(strictRateLimit, loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/change-password').post(verifyJWT, changePassword);
router.route('/update-profile').patch(verifyJWT, updateProfile);
router.route('/currentUser').get(verifyJWT, getCurrentUser);
router.route('/delete').delete(verifyJWT, deleteAccount);
router.route('/refresh-token').post(refreshAccessToken);

export default router;