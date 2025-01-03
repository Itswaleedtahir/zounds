const Role = require("../models/role");

module.exports = {
    createRole: async(req,res)=>{
        const { role, actions } = req.body; // actions should be an array of action IDs

        try {
             // Check if a role with the same name already exists
        const existingRole = await Role.findOne({ role: role });
        if (existingRole) {
            return res.status(409).json({ message: "Role already exists" }); // 409 Conflict for duplicate resource
        }
            // Filter to include only unique IDs
            const uniqueActions = [...new Set(actions)];
    
            // Create new role with unique actions
            const newRole = await Role.create({
                role,
                Permissions: uniqueActions
            });
    
            return res.status(201).json(newRole);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },
    updateRole: async(req, res) => {
        const { permissions } = req.body; // Array of new action IDs to set as the role's permissions
        const { id } = req.params;
    
        try {
            const roleToUpdate = await Role.findById(id);
    
            if (!roleToUpdate) {
                return res.status(404).json({ message: "Role not found" });
            }
    
            // Assign new permissions array directly, assuming it's already validated and deduplicated
            roleToUpdate.Permissions = [...new Set(permissions)]; // Ensure uniqueness just in case
    
            await roleToUpdate.save();
    
            return res.status(200).json(roleToUpdate);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },
    
    deleteRole: async(req,res)=>{
        const { id } = req.params;

    try {
        const deletedRole = await Role.findByIdAndDelete(id);
        if (!deletedRole) {
            return res.status(404).json({ message: "Role not found" });
        }

        return res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
    },
    getAllRoles: async(req,res)=>{
        try {
            const roles = await Role.find().populate('Permissions');
            return res.status(200).json(roles);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },
    getSingleRoles: async(req,res)=>{
        const { id } = req.params;

    try {
        const role = await Role.findById(id).populate('Permissions');
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        return res.status(200).json(role);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
    }
};


