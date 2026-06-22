import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import jwt from 'jsonwebtoken';

const registerUser = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username || email.trim() === "" || password.trim() === "" || username.trim() === "") {
        throw new ApiError(404, "all fields are required")
    }
    
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) throw new ApiError(404, "User already exists");

    const user = await User.create({
        email: email,
        username: username,
        password: password
    });

    const newUser = await User.findById(user?._id).select("-password -refreshToken")
    if (!newUser) {
        throw new ApiError(404, "new user could not be created")
    }

    return res.status(200).json(
        new ApiResponse(200, newUser, "User created successfully")
    )
});

const generateToken = async (userId) => {
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "user not found during token generation")
    }

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
};

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password || email.trim() === "" || password.trim() === "") {
        throw new ApiError(404, "all fields are required")
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
    const check = await user.isPasswordCorrect(password)
    if (!check) {
        throw new ApiError(404, "incorrect password")
    }
    const { accessToken, refreshToken } = await generateToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    if (!loggedInUser) {
        throw new ApiError(404, "loggedIn user error")
    }
    const options = {
        httpOnly: true,
        sameSite: "none",
        secure:true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, loggedInUser, "user logged in successfully")
        )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) throw new ApiError(404, "Refresh token missing")

    const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decoded._id)
    if (!user || user.refreshToken !== refreshToken) {
        throw new ApiError(404, "Invalid refresh token")
    }

    const accessToken = user.generateAccessToken()

    const options = { httpOnly: true, secure: true, sameSite: "none" };
    return res
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, {}, "Token refreshed"))
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    )
    const options = {
        httpOnly: true,
        secure: true,
        sameSite:"none"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
});

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id)
    if (!user) throw new ApiError(404, "user not found");
    
    const check = await user.isPasswordCorrect(oldPassword);
    if (!check) throw new ApiError(404, "wrong password")

    user.password = newPassword
    await user.save()
    return res.status(200).json(
        new ApiResponse(200, {}, "password changed successfully")
    )
});

const updateProfile = asyncHandler(async (req, res) => {
    const { username } = req.body
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { username },
        { new: true }
    ).select("-password -refreshToken")

    res.status(200).json(new ApiResponse(200, user, "Profile updated"))
});

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(404, "not authorized")
    return res.status(200).json(
        new ApiResponse(200, req.user, "user fetched successfully")
    )
});

const deleteAccount = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    }
    await User.findByIdAndDelete(req.user._id)

    res
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .status(200)
        .json(new ApiResponse(200, {}, "Account deleted successfully"))
});

export {
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    updateProfile,
    getCurrentUser,
    deleteAccount,
    refreshAccessToken
}