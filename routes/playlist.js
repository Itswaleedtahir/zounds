const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/playlist");

router.post("/createPlaylist",authPolicy,controller.createPlaylist)
router.get("/getAllPlaylists",authPolicy,controller.getPlaylists)
router.get("/getSinglePlaylist/:id",authPolicy,controller.getSinglePlaylist)
router.put("/updatePlaylist/:playlistId",authPolicy,controller.updatePlaylist)
router.delete("/deletePlaylist/:id",authPolicy,controller.deletePlaylist)

module.exports = router;
