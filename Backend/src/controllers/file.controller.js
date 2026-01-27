import { File } from '../models/File.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js' 
import { ApiResponse } from '../utils/ApiResponse.js'


const getRoomFiles = asyncHandler(async(req, res) => {
    const files = await File.find({ roomId: req.params.roomId })
        .sort({ type: 1, name: 1 });

    return res.status(200).json(
        new ApiResponse(200, files || [], "files fetched successfully")
    )
})

const createFileOrFolder = asyncHandler(async(req, res) => {
    const { roomId } = req.params;
    const { name, path, type, content = '', language = null } = req.body

    const existingFile = await File.findOne({ roomId, path });
    if (existingFile) {
        throw new ApiError(409, "File or folder already exists at this path");
    }

    const newFile = await File.create({ roomId, name, path, type, content, language });

    return res.status(201).json(
        new ApiResponse(201, newFile, "Created successfully")
    )
})

const updateFile = asyncHandler(async(req, res) => {
    const { roomId } = req.params;
    const { path, content } = req.body; 

    const file = await File.findOneAndUpdate(
        { roomId, path, type: 'file' },
        { 
            content, 
            $set: { updatedAt: new Date() } 
        },
        { new: true }
    )

    if (!file) throw new ApiError(404, "File not found")

    return res.status(200).json(
        new ApiResponse(200, file, "File saved")
    )
})

const deleteFileOrFolder = asyncHandler(async(req, res) => {
    const { roomId } = req.params;
    const { path } = req.body;

    if (!path) throw new ApiError(400, "Path is required");

    const safePath = escapeRegExp(path);
    await File.deleteMany({
        roomId,
        $or: [
            { path: path }, 
            { path: new RegExp(`^${safePath}/`) } 
        ]
    });
    return res.status(200).json(
        new ApiResponse(200, null, "Deleted successfully")
    )
})

const getFileContent = asyncHandler(async(req, res) => {
    const { path } = req.query
    if(!path) throw new ApiError(400, "Path is required");

    const file = await File.findOne({ roomId: req.params.roomId, path: path }) 
    if (!file) throw new ApiError(404, "File not found")
    
    return res.status(200).json(
        new ApiResponse(200, file, "Content fetched")
    )
})

export {
    getRoomFiles,
    createFileOrFolder,
    updateFile,
    deleteFileOrFolder,
    getFileContent
}