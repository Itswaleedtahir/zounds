const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
const {checkRole}=require("../utils")
const {ROLES} = require("../utils/constant")
// Controllers
const controller = require("../controllers/adminController");
console.log("roles",ROLES)
// Routes
router.post("/createAdmin",authPolicy,checkRole([ROLES.ADMIN]),controller.addAdmin)
router.post("/adminLogin",controller.adminLogin)
router.post("/adminForgot",controller.forgetPassword)
router.post("/adminVerify",controller.adminVerify)
router.post("/adminReset",controller.resetPassword)
router.post("/adminUpdate",authPolicy,controller.updateAdmin)
router.post("/labelCreate",authPolicy,checkRole([ROLES.ADMIN]),controller.labelCreation)
router.post("/adminDelete/:id",authPolicy,checkRole([ROLES.ADMIN]),controller.deleteAdmin)

module.exports = router;
