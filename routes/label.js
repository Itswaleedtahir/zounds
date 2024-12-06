const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
const {checkRole,checkPermission}=require("../utils")
const {ROLES} = require("../utils/constant")
// Controllers
const controller = require("../controllers/Label");
console.log("roles",ROLES)
// Routes
router.post("/createSong",authPolicy,checkPermission("Content,Add"),controller.createSong)
router.post("/createArtist",authPolicy,checkPermission("Artists,Add"),controller.addArtist)
router.get("/getSongs",authPolicy,checkPermission("Content,View"),controller.getAllSongsOfLabel)
router.put("/updateSong/:songId",authPolicy,checkPermission("Content,Update"),controller.updateSong)


module.exports = router;
