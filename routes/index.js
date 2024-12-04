const { Router } = require("express");
const router = Router();

// Routers
const userRouter = require("./user");
const artistRouter = require("./artist");
const genreRouter = require("./genre");


router.use('/users', userRouter);
router.use('/artists', artistRouter);
router.use('/genre', genreRouter);

module.exports = router;
