const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
const {checkRole}=require("../utils")
const {ROLES} = require("../utils/constant")
// Controllers
const controller = require("../controllers/Label");
console.log("roles",ROLES)
// Routes
router.post("/createSong",authPolicy,checkRole([ROLES.LABEL]),controller.createSong)
router.post("/createArtist",authPolicy,checkRole([ROLES.LABEL]),controller.addArtist)
router.get("/getSongs",authPolicy,checkRole([ROLES.LABEL]),controller.getAllSongsOfLabel)
router.put("/updateSong/:songId",authPolicy,checkRole([ROLES.LABEL]),controller.updateSong)


module.exports = router;
