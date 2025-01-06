const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/social");
const {checkPermission}=require("../utils")
// Routes

router.post("/createSocial",authPolicy,controller.createSocials)
router.get("/getAllSocial",authPolicy,controller.getSocials)
router.put("/updateSocial/:id",authPolicy,controller.updateSocial)
router.delete("/deleteSocial/:id",authPolicy,controller.deleteSocial)

module.exports = router;
