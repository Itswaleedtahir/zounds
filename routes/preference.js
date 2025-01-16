const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/preference");
const {checkPermission}=require("../utils")
// Routes

router.post("/createPreference",authPolicy,checkPermission("Content References,Add"),controller.createPreference)
router.get("/getAllPreference",authPolicy,checkPermission("Content References,View"),controller.getPreferences)
router.delete("/deletePreference/:id",authPolicy,checkPermission("Content References,Delete"),controller.deletePreference)

module.exports = router;
