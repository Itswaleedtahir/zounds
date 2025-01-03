const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
const {checkRole}=require("../utils")
const {checkPermission}=require("../utils")
const {ROLES} = require("../utils/constant")
// Controllers
const controller = require("../controllers/adminController");
// Routes
router.post("/createAdmin",authPolicy,controller.addAdmin)
router.post("/adminLogin",controller.adminLogin)
router.post("/adminForgot",controller.forgetPassword)
router.post("/adminVerify",controller.adminVerify)
router.post("/adminReset",controller.resetPassword)
router.post("/adminUpdate",authPolicy,controller.updateAdmin)
router.post("/createActions", controller.createActions);
router.get("/getActions", controller.getActions);
router.get("/getAllLabels",authPolicy ,controller.getAllLabels);
router.get("/getAllUsers",authPolicy,controller.getAllUsers);
router.get("/getAllCustomers",authPolicy,controller.getCustomers);
router.get("/getAllCount",authPolicy,controller.getCount);
router.post("/changePassword",authPolicy,controller.changePassword);
router.get("/getAllDataOfLabel/:id",authPolicy,controller.getAllSongsOfLabel);
router.get("/getSingleLabelCount/:id",authPolicy,controller.getSingleLableCount);
router.post("/labelCreate",authPolicy,checkPermission("Labels,Add"),controller.labelCreation)
router.put("/updateCustomer/:id",authPolicy,controller.updateCustomers);
router.delete("/deleteCustomer/:id",authPolicy,controller.deleteCustomer);
router.post("/adminDelete/:id",authPolicy,checkRole([ROLES.ADMIN]),controller.deleteAdmin)
router.put("/editUser/:userId",authPolicy,controller.updateUser)

module.exports = router;
