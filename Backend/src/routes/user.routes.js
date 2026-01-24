import {Router} from "express"
import {upload} from "../middleware/multer.js"
import {registerUser,loginUser,logoutUser,changePassword,updateUserAvatar,updateProfile,getCurrentUser,deleteAccount,refreshAccessToken} from "../controllers/userController.js"
import { verifyJWT } from './../middleware/auth.js';

const router = Router();
router.route('/register').post(upload.single("avatar"),registerUser);
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT,logoutUser);
router.route('/change-password').post(verifyJWT,changePassword)
router.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route('/update-profile').patch(verifyJWT,updateProfile)
router.route('/currentUser').get(verifyJWT,getCurrentUser)
router.route('/delete').delete(verifyJWT,deleteAccount)
router.route('/refresh-token').post(refreshAccessToken)

export default router;