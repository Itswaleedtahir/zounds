const { Router } = require("express");
const router = Router();

// Middlewares

// Controllers
const controller = require("../controllers/artist");

// Routes
router.post("/createArtist", controller.createArtist)
router.get("/getArtists", controller.getArtist)
router.get("/getRecentArtists", controller.getRecentArtists)
router.post("/createAlbum", controller.createAlbum)
router.post("/createSong", controller.createSong)
router.post("/createAudioSong", controller.audioSong)
router.get("/getArtistById/:id", controller.getSingleArtist)

module.exports = router;
