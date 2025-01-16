const Preference = require("../models/preference")
module.exports = {
    createPreference : async (req, res) => {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ msg: "Please provide preference", success: false });
            }
            const preferenceAdd = new Preference({
                name:name,
            });
    
            const savedPreference = await preferenceAdd.save();
         return   res.status(201).json(savedPreference);
        } catch (error) {
            console.log("error",error)
         return   res.status(400).json({ message: error.message });
        }
    },
     getPreferences : async (req, res) => {
        try {
        // Find all artists created by this label
        const preferences = await Preference.find();
        if (!preferences.length) {
            return res.status(404).json({ msg: "no preference found", success: false });
        }
       return res.status(200).json({preference:preferences});
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    },  
    deletePreference: async(req,res)=>{
        try {
            const prefId = req.params.id;
      const photo = await Preference.findByIdAndDelete(prefId);

    return  res.status(200).json({ message: 'prefernece deleted' });
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    }
}