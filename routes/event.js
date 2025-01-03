const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/events");
const {checkPermission}=require("../utils")
// Routes

router.post("/createEvent",authPolicy,checkPermission("Events,Add"),controller.createEvents)
router.get("/getAllEvent",authPolicy,checkPermission("Events,View"),controller.getEvents)
router.put("/updateEvent/:id",authPolicy,checkPermission("Events,Update"),controller.updateEvents)
router.delete("/deleteEvent/:id",authPolicy,checkPermission("Events,Delete"),controller.deleteEvents)

module.exports = router;
