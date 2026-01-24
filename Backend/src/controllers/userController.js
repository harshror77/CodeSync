import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import { User } from "../models/User.js";
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler( async(req,res)=>{
    const {email,password,username} = req.body;
    if(!email || !password || !username || email.trim()==="" || password.trim()==="" || username.trim()===""){
        throw new ApiError(404,"all fields are required")
    }
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser) throw new ApiError(404,"User already exists");
    const avatarPath = req.file?.path
    let avatar;
    if(avatarPath){
        avatar = await uploadOnCloudinary(avatarPath);
        if(!avatar) throw new ApiError(404,"error while uploading avatar");
    }
    
    const user = await User.create({
        email:email,
        username:username,
        password:password,
        avatar:avatar?.url || ""
    })
    const newUser = await User.findById(user?._id).select("-password -refreshToken")
    if(!newUser){
        throw new ApiError(404,"new user could not be created")
    }
    return res.status(200).json(
        new ApiResponse(200,newUser,"User created successfully")
    )
})

const generateToken = async(userId)=>{
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404,"user not found during token generation")
    }

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken}
}
const loginUser= asyncHandler(async(req,res)=>{
    const {email,password} = req.body
    if(!email || !password || email.trim()==="" || password.trim()===""){
        throw new ApiError(404,"all fields are required")
    }
    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
    const check = await user.isPasswordCorrect(password)
    if(!check){
        throw new ApiError(404,"incorrect password")
    }
    const {accessToken,refreshToken} = await generateToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    if(!loggedInUser){
        throw new ApiError(404,"loggedIn user error")
    }
    const options = {
        httpOnly:true,
        //secure:true,
        sameSite:"strict"
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,loggedInUser,"user logged in successfully")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) throw new ApiError(404,"Refresh token missing")

  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET
  )

  const user = await User.findById(decoded._id)
  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(404,"Invalid refresh token")
  }

  const accessToken = user.generateAccessToken()

  return res
    .cookie("accessToken", accessToken, { httpOnly: true })
    .json(new ApiResponse(200, {}, "Token refreshed"))
})

const logoutUser = asyncHandler( async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user?._id,
        {$unset:{refreshToken:1}},
        {new:true}
    )
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const changePassword = asyncHandler( async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    if(!user) throw new ApiError(404,"user not found");
    const check = await user.isPasswordCorrect(oldPassword);
    if(!check) throw new ApiError(404,"wrong password")
    
    user.password = newPassword
    await user.save()
    return res.status(200).json(
        new ApiResponse(200,{},"password changed successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(404,"Avatar required")

  const user = await User.findById(req.user._id)

  if (user.avatar) {
    await deleteFromCloudinary(user.avatar)
  }

  const avatar = await uploadOnCloudinary(req.file.path)
  if (!avatar?.url) throw new ApiError(404,"Avatar upload failed")

  user.avatar = avatar.url
  await user.save({ validateBeforeSave: false })

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  return res.json(
    new ApiResponse(200, updatedUser, "Avatar updated")
  )
})

const updateProfile = asyncHandler(async (req, res) => {
    const { username } = req.body   
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username },
      { new: true }
    ).select("-password -refreshToken") 

    res.status(200).json(new ApiResponse(200, user, "Profile updated"))
})

const getCurrentUser = asyncHandler( async(req,res)=>{
    if(!req.user) throw new ApiError(404,"not autohrized")
    return res.status(200).json(
        new ApiResponse(200,req.user,"user fethed successfully")
    )
})

const deleteAccount = asyncHandler(async (req, res) => {
  const user  = await User.findById(req.user._id)
  if (user.avatar) {
    await deleteFromCloudinary(user.avatar)
  }
  await User.findByIdAndDelete(req.user._id)

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .status(200)
    .json(new ApiResponse(200, {}, "Account deleted successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    updateUserAvatar,
    updateProfile,
    getCurrentUser,
    deleteAccount,
    refreshAccessToken
}