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
router.put("/update-profile", authPolicy, controller.updateProfile);
router.get("/getPreference",authPolicy,controller.userArtists)
router.get("/getRedeemAlbums",authPolicy,controller.getAlbumsOfUserRedeemed)
router.get("/getAllArtists",authPolicy,controller.getAllArtists)
// By Mujeeb
router.get("/getAllArtistsDownload",authPolicy,controller.getAllArtistsDownload)

router.get("/getAllGenres",authPolicy,controller.getAllGenre)
router.post("/downloadArtist",authPolicy,controller.downloadArtist)
router.post("/artistSongs",authPolicy,controller.artistSongs)
router.get("/getDownloadArtists",authPolicy,controller.getDownloadedArtists)
router.post("/removeDownloadedArtist",authPolicy,controller.removeDownloadedArtist)
router.get("/getSingleArtist/:artistId",authPolicy,controller.getSingleDownloadArtist)
router.get("/getRedeemedAlbum/:albumId",authPolicy,controller.getRedeemedAlbums)
router.get("/getRedeemedAlbumVideo/:albumId",authPolicy,controller.getRedeemedAlbumVideos)
router.get("/getRedeemedAlbumAudio/:albumId",authPolicy,controller.getRedeemedAlbumAudios)
router.get("/getArtistSocial/:artistId",authPolicy ,controller.getSocials);
router.get("/getArtistNews/:artistId",authPolicy ,controller.getNewsEvents);
router.get("/getFeaturedAlbums/:artistId",authPolicy ,controller.getFeatureAlbums);
router.get("/getArtistShop/:artistId",authPolicy ,controller.getArtistShop);
router.get("/getArtistMedia/:artistId",authPolicy ,controller.getArtistPhotos);
router.get("/getArtistListeners/:artistId",authPolicy ,controller.listeningCount);
router.get("/getSongNames/:id",authPolicy ,controller.getSongNames);

module.exports = router;
