const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/news");
const {checkPermission}=require("../utils")
// Routes

router.post("/createNews",authPolicy,checkPermission("News & Updates,Add"),controller.createNews)
router.get("/getAllNews",authPolicy,checkPermission("News & Updates,View"),controller.getNews)
router.put("/updateNews/:id",authPolicy,checkPermission("News & Updates,Update"),controller.updateNews)
router.delete("/deleteNews/:id",authPolicy,checkPermission("News & Updates,Delete"),controller.deleteNews)

module.exports = router;
