import axios from "axios"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { roomService } from "../services/room.service.js"

const createRoom = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { username } = req.body

    const room = await roomService.createRoom(userId, username)

    return res.status(200).json(
        new ApiResponse(200, room, "Room created")
    )
})

const joinRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params
    const userId = req.user._id
    const { username } = req.body

    const result = await roomService.joinRoom(roomId, userId, username)

    return res.status(200).json(
        new ApiResponse(200, result, "Room joined successfully")
    )
})

const leaveRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params
    const userId = req.user._id

    const result = await roomService.leaveRoom(roomId, userId)
    if (!result) throw new ApiError(404, "Room not found")

    return res.status(200).json(
        new ApiResponse(200, {}, "Left room successfully")
    )
})

const deleteRoom = asyncHandler(async (req, res) => {
    const result = await roomService.deleteRoom(req.params.roomId)

    return res.status(200).json(
        new ApiResponse(200, result, "Room deleted successfully")
    )
})

const getUserRooms = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const rooms = await roomService.getUserRooms(userId)

    return res.status(200).json(
        new ApiResponse(200, rooms, "Rooms fetched")
    )
})

const getRoomUsers = asyncHandler(async (req, res) => {
    const { roomId } = req.params

    const users = await roomService.getRoomUsers(roomId)

    return res.status(200).json(
        new ApiResponse(200, users, "Room users fetched")
    )
})


const executeCode = asyncHandler(async (req, res) => {
    const { language, code } = req.body
    if (!language || !code) {
        throw new ApiError(400, "Language and code are required")
    }

    const langMap = {
        javascript: "js",
        python: "py",
        c: "c",
        cpp: "cpp"
    }

    const { data } = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
            language: langMap[language] || language,
            version: "*",
            files: [{ content: code }]
        }
    )

    return res.status(200).json(
        new ApiResponse(200, {
            output: data.run.stdout || "",
            error: data.run.stderr || ""
        }, "Code executed")
    )
})

export {
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    getUserRooms,
    getRoomUsers,
    executeCode
}
