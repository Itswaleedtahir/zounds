const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
const {checkPermission}=require("../utils")
// Controllers
const controller = require("../controllers/Label");
// Routes
router.post("/createSong",authPolicy,checkPermission("Content,Add"),controller.createSong)
router.post("/createArtist",authPolicy,checkPermission("Artists,Add"),controller.addArtist)
router.get("/getSongs",authPolicy,checkPermission("Content,View"),controller.getAllSongsOfLabel)
router.get("/getLabelArtists",authPolicy,checkPermission("Artists,View"),controller.getLabelArtists)
router.get("/getLabelArtistSingle/:artistId",authPolicy,checkPermission("Artists,View"),controller.getSingleArtist)
router.put("/updateLabelArtistSingle/:id",authPolicy,checkPermission("Artists,Update"),controller.updateArtist)
router.put("/updateSong/:songId",authPolicy,checkPermission("Content,Update"),controller.updateSong)
router.delete("/deleteArtist/:id",authPolicy,checkPermission("Artists,Delete"),controller.deleteArtist)
router.delete("/deleteSong/:songId",authPolicy,checkPermission("Content,Delete"),controller.deleteSong)


module.exports = router;
