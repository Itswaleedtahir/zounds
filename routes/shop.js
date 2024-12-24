const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/shop");
const {checkPermission}=require("../utils")
// Routes

router.post("/createShop",authPolicy,checkPermission("Shop,Add"),controller.createShop)
router.get("/getAllShops",authPolicy,checkPermission("Shop,View"),controller.getShops)
router.put("/updateShop/:id",authPolicy,checkPermission("Shop,Update"),controller.updateShop)
router.delete("/deleteShop/:id",authPolicy,checkPermission("Shop,Delete"),controller.deleteShop)

module.exports = router;
