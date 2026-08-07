const express = require("express");
const { protect, restrictTo } = require("../middlewares/authMiddleware");
const { uploadAvatar } = require("../middlewares/uploadMiddleware");
const userController = require("../controllers/UserController");

const router = express.Router();

router.use(protect);

router.get("/me", userController.getProfile);
router.patch("/me", uploadAvatar, userController.updateProfile);
router.post("/me/change-password", userController.changePassword);

router.use(restrictTo("admin"));

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.patch("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
