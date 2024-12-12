const { Router } = require("express");
const router = Router();

// Routers
const userRouter = require("./user");
const artistRouter = require("./artist");
const genreRouter = require("./genre");
const adminRouter = require("./admin");
const labelRouter = require("./label");
const roleRouter = require("./roles");
const albumRouter = require("./album");
const newsRouter = require("./news");
const eventRouter = require("./event");


router.use('/v1/users', userRouter);
router.use('/artists', artistRouter);
router.use('/genre', genreRouter);
router.use('/admin', adminRouter);
router.use('/label', labelRouter);
router.use('/role', roleRouter);
router.use('/album', albumRouter);
router.use('/news', newsRouter);
router.use('/events', eventRouter);

module.exports = router;
