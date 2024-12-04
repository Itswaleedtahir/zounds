const { Router } = require("express");
const router = Router();

// Middlewares

// Controllers
const controller = require("../controllers/user");
const authPolicy = require("../utils/authPolicy");

// Routes

router.post("/sign-up", controller.addUser);
router.post("/verify-user", controller.verifyUser);
router.post("/resend-otp", controller.resendOTP);
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post("/createPreferences",authPolicy ,controller.userPrefrences);
router.post("/uplaodFile", controller.fileUploadS3);

module.exports = router;
