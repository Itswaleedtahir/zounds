const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/chat");
const {checkPermission}=require("../utils")
// Routes

router.post("/createChat",authPolicy,checkPermission("Chat,Add"),controller.createChat)
router.post("/createReaction",authPolicy,controller.createReaction)
router.get("/getAllChat",authPolicy,checkPermission("Chat,View"),controller.getChats)
router.put("/updateChat/:id",authPolicy,checkPermission("Chat,Update"),controller.updateChat)
router.get("/getAllChats/:artistId",authPolicy,controller.getAllMessages)
router.delete("/deleteMessage/:id",authPolicy,checkPermission("Chat,Delete"),controller.deleteChat)
router.delete("/removeReaction/:reactionId",authPolicy,controller.removeReaction)

module.exports = router;
