import { Router } from "express"
import { verifyJWT } from "../middleware/auth.js"
import { getRoomFiles, createFileOrFolder, updateFile, deleteFileOrFolder, getFileContent } from "../controllers/file.controller.js"

const router = Router();
router.use(verifyJWT);

router.route("/:roomId").get(getRoomFiles);
router.route("/:roomId/create").post(createFileOrFolder);
router.route("/:roomId/update").put(updateFile);
router.route("/:roomId/delete").delete(deleteFileOrFolder);
router.route("/:roomId/content").get(getFileContent);

export default router;