const { Router } = require("express");
const router = Router();

// Routers
const userRouter = require("./user");
const genreRouter = require("./genre");
const adminRouter = require("./admin");
const labelRouter = require("./label");
const roleRouter = require("./roles");
const albumRouter = require("./album");
const newsRouter = require("./news");
const eventRouter = require("./event");
const nfcRouter = require("./nfc");
const playlistRouter = require("./playlist");
const likeSongRouter = require("./likedSongs");
const chatRouter = require("./chat");
const shopRouter = require("./shop");


router.use('/v1/users', userRouter);
router.use('/v1/playlist', playlistRouter);
router.use('/v1/like', likeSongRouter);
router.use('/genre', genreRouter);
router.use('/admin', adminRouter);
router.use('/label', labelRouter);
router.use('/role', roleRouter);
router.use('/album', albumRouter);
router.use('/news', newsRouter);
router.use('/events', eventRouter);
router.use('/shop', shopRouter);
router.use('/chat', chatRouter);
router.use('/nfc', nfcRouter);

module.exports = router;
