const { Router } = require("express");
const router = Router();

// Routers
const userRouter = require("./user");
const artistRouter = require("./artist");
const genreRouter = require("./genre");
const adminRouter = require("./admin");
const labelRouter = require("./label");


router.use('/users', userRouter);
router.use('/artists', artistRouter);
router.use('/genre', genreRouter);
router.use('/admin', adminRouter);
router.use('/label', labelRouter);

module.exports = router;
