const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
const {checkPermission}=require("../utils")
// Controllers
const controller = require("../controllers/artist");

// Routes
router.get("/getArtists",authPolicy,controller.getArtist)
router.get("/getRecentArtists", controller.getRecentArtists)
router.get("/getArtistById/:id", controller.getSingleArtist)

module.exports = router;
