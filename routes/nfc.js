const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/nfc");
const {checkPermission}=require("../utils")
// Routes

router.post("/createNfc",authPolicy,checkPermission("Manage NFC,Add"),controller.createNfc)
router.get("/getAllNfc",authPolicy,checkPermission("Manage NFC,View"),controller.getAllNfcs)
router.get("/getAllNfcOnStatus",authPolicy,checkPermission("Manage NFC,View"),controller.getNfcsOnStatus)
router.get("/downloadCsv",authPolicy,checkPermission("Manage NFC,View"),controller.downloadCsv)
router.post("/verifyNfc",authPolicy,controller.verifyNfc)
router.put("/updateNfc/:id",authPolicy,checkPermission("Genres,Update"),controller.updateNfc)
// router.delete("/deleteGenre/:id",authPolicy,checkPermission("Genres,Delete"),controller.deleteGenre)

module.exports = router;
