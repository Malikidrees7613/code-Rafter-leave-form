const express = require("express");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const { uploadAttachment } = require("../middlewares/uploadMiddleware");
const leaveController = require("../controllers/LeaveController");

const router = express.Router();

router.use(protect);

router.post("/", uploadAttachment, leaveController.createLeave);
router.get("/", leaveController.getMyLeaves);
router.get("/all", restrictTo("admin"), leaveController.getAllLeaves);
router.get("/:id", leaveController.getLeaveById);
router.patch("/:id/status", restrictTo("admin"), leaveController.updateLeaveStatus);
router.patch("/:id/cancel", leaveController.cancelLeave);
router.delete("/:id", leaveController.deleteLeave);

module.exports = router;
