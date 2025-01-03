const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/album");
const {checkPermission}=require("../utils")
// Routes

router.post("/createAlbum",authPolicy,checkPermission("Albums,Add"),controller.createAlbum)
router.get("/getAllAlbum",authPolicy,checkPermission("Albums,View"),controller.getAlbums)
router.get("/getRecentAlbum",authPolicy,controller.getRecentAlbums)
router.get("/getAllAlbumsApp",authPolicy,controller.getAllRedeemedAlbums)
router.get("/getSingleAlbum/:albumId",authPolicy,checkPermission("Albums,View"),controller.getSingleAlbum)
router.get("/getSingleAlbumApp/:albumId",authPolicy,controller.getSingleAlbumApp)
// router.put("/updateGenre/:id",authPolicy,checkPermission("Genres,Update"),controller.updateGenre)
// router.delete("/deleteGenre/:id",authPolicy,checkPermission("Genres,Delete"),controller.deleteGenre)

module.exports = router;
