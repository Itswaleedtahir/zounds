const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
const {checkPermission}=require("../utils")
// Controllers
const controller = require("../controllers/Label");
// Routes
router.post("/createSong",authPolicy,checkPermission("Content,Add"),controller.createSong)
router.post("/createPhoto",authPolicy,checkPermission("Content,Add"),controller.createPhoto)
router.post("/createArtist",authPolicy,checkPermission("Artists,Add"),controller.addArtist)
router.get("/getSongs",authPolicy,checkPermission("Content,View"),controller.getAllSongsOfLabel)
router.get("/getPhotos",authPolicy,checkPermission("Content,View"),controller.getPhotos)
router.get("/getLabelArtists",authPolicy,checkPermission("Artists,View"),controller.getLabelArtists)
router.get("/getLabelArtistSingle/:artistId",authPolicy,checkPermission("Artists,View"),controller.getSingleArtist)
router.get("/getSinglePhoto/:id",authPolicy,checkPermission("Content,View"),controller.getSinglePhoto)
router.put("/updateLabelArtistSingle/:id",authPolicy,checkPermission("Artists,Update"),controller.updateArtist)
router.put("/updatePhoto/:id",authPolicy,checkPermission("Content,Update"),controller.updatePhoto)
router.put("/updateSong/:songId",authPolicy,checkPermission("Content,Update"),controller.updateSong)
router.delete("/deleteArtist/:id",authPolicy,checkPermission("Artists,Delete"),controller.deleteArtist)
router.delete("/deletePhoto/:id",authPolicy,checkPermission("Content,Delete"),controller.deletePhoto)
router.delete("/deleteSong/:songId",authPolicy,checkPermission("Content,Delete"),controller.deleteSong)
router.delete("/deleteAlbum/:id",authPolicy,checkPermission("Albums,Delete"),controller.deleteAlbum)


module.exports = router;
