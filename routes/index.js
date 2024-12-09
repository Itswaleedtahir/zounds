const { Router } = require("express");
const router = Router();

// Routers
const userRouter = require("./user");
const artistRouter = require("./artist");
const genreRouter = require("./genre");
const adminRouter = require("./admin");
const labelRouter = require("./label");
const roleRouter = require("./roles");


router.use('/users', userRouter);
router.use('/artists', artistRouter);
router.use('/genre', genreRouter);
router.use('/admin', adminRouter);
router.use('/label', labelRouter);
router.use('/role', roleRouter);

module.exports = router;
