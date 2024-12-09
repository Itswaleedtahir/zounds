const Role = require("../models/role");

module.exports = {
    createRole: async(req,res)=>{
        const { role, actions } = req.body; // actions should be an array of action IDs

        try {
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
    updateRole: async(req,res)=>{
        const { addActions, removeActions } = req.body; // Arrays of action IDs to add or remove
        const { id } = req.params;
    
        try {
            const roleToUpdate = await Role.findById(id);
    
            if (!roleToUpdate) {
                return res.status(404).json({ message: "Role not found" });
            }
    
            // Handle addition of new actions
            let updatedActions = roleToUpdate.Permissions.map(id => id.toString());
            if (addActions && addActions.length > 0) {
                updatedActions = [...new Set([...updatedActions, ...addActions])]; // Combine and deduplicate
            }
    
            // Handle removal of actions
            if (removeActions && removeActions.length > 0) {
                updatedActions = updatedActions.filter(id => !removeActions.includes(id));
            }
    
            roleToUpdate.Permissions = updatedActions;
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


