const { Router } = require("express");
const router = Router();

// Middlewares

// Controllers
const controller = require("../controllers/genre");

// Routes

router.post("/createGenre",controller.createGenre)
router.get("/getAllGenre",controller.getAllGenre)

module.exports = router;
