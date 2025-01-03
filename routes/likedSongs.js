const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/likedSongs");
// Routes

router.post("/likeSong",authPolicy,controller.likeSong)
router.get("/getAllLikedSongs",authPolicy,controller.getAllLikedSongs)
// router.put("/updateGenre/:id",authPolicy,checkPermission("Genres,Update"),controller.updateGenre)
router.delete("/unlikeSong/:id",authPolicy,controller.removeFromLikeSong)

module.exports = router;
