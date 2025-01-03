const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/genre");
const {checkPermission}=require("../utils")
// Routes

router.post("/createGenre",authPolicy,checkPermission("Genres,Add"),controller.createGenre)
router.get("/getAllGenre",authPolicy,checkPermission("Genres,View"),controller.getAllGenre)
router.put("/updateGenre/:id",authPolicy,checkPermission("Genres,Update"),controller.updateGenre)
router.delete("/deleteGenre/:id",authPolicy,checkPermission("Genres,Delete"),controller.deleteGenre)

module.exports = router;
