const { Router } = require("express");
const router = Router();

// Middlewares

// Controllers
const controller = require("../controllers/user");
const authPolicy = require("../utils/authPolicy");

// Routes

router.post("/sign-up", controller.addUser);
router.post("/verify-user", controller.verifyUser);
router.post("/resend-otp", controller.resendOTP);
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post("/createPreferences",authPolicy ,controller.userPrefrences);
router.post("/recentlyPlayed",authPolicy ,controller.addSongHistory);
router.get("/getRecentlyPlayed",authPolicy ,controller.getHistorySongs);
router.post("/uplaodFile", controller.fileUploadS3);
router.post("/googleLogin",controller.googleVerify)
router.post("/appleLogin",controller.appleLogin)
router.get("/getPreference",authPolicy,controller.userArtists)
router.get("/getRedeemAlbums",authPolicy,controller.getAlbumsOfUserRedeemed)
router.get("/getAllArtists",authPolicy,controller.getAllArtists)
router.get("/getAllArtistsDownload",authPolicy,controller.getAllArtistsDownload)
router.get("/getAllGenres",authPolicy,controller.getAllGenre)
router.post("/downloadArtist",authPolicy,controller.downloadArtist)
router.get("/getDownloadArtists",authPolicy,controller.getDownloadedArtists)
router.get("/getSingleArtist/:artistId",authPolicy,controller.getSingleDownloadArtist)
router.get("/getRedeemedAlbum/:albumId",authPolicy,controller.getRedeemedAlbums)

module.exports = router;
