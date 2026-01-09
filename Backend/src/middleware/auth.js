import { asynchandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import {User} from '../models/User.js'

export const verifyJWT=asynchandler(async(req,_,next)=>{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    if(!token) throw new ApiError(401,"Unauthorized request")

    const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id)
    if(!user) throw new ApiError(401,"Invalid access token")

    req.user = user;
    next()
})