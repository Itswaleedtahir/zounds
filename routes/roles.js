const { Router } = require("express");
const router = Router();

// Middlewares
const authPolicy = require("../utils/authPolicy");
// Controllers
const controller = require("../controllers/role");
// Routes

router.post("/createRole",authPolicy,controller.createRole)
router.get("/getRoles",authPolicy,controller.getAllRoles)
router.put("/updateRole/:id",authPolicy,controller.updateRole)
router.get("/getSingleRole/:id",authPolicy,controller.getSingleRoles)
router.delete("/deleteRole/:id",authPolicy,controller.deleteRole)

module.exports = router;
