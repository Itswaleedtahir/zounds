const Social = require("../models/social")
const Artist = require("../models/artist")
const Dashboarduser = require("../models/dashboardUsers")
module.exports = {
    createSocials: async (req, res) => {
    try {
        const { socials } = req.body;

        // Validate input
        if (!socials || !Array.isArray(socials) || socials.some(social => !social.social || !social.socialLink)) {
            return res.status(400).json({ msg: "Please provide social details", success: false });
        }

        let artist;
        if (req.token.role === 'ARTIST') {
            artist = await Artist.findOne({ userId: req.token._id });
            if (!artist) {
                return res.status(404).json({ msg: "Artist not found", success: false });
            }
        } else {
            return res.status(403).json({ msg: "Unauthorized access", success: false });
        }

        // Check for duplicates
        const existingSocials = await Social.find({ artist_id: artist._id });
        const existingTypes = new Set(existingSocials.map(s => s.social.toLowerCase()));

        const duplicates = socials.filter(s => existingTypes.has(s.social.toLowerCase()));
        if (duplicates.length > 0) {
            return res.status(400).json({
                msg: `Social "${duplicates[0].social}" already exists`,
                success: false
            });
        }

        // Prepare new socials
        const socialLinksToAdd = socials.map(s => ({
            artist_id: artist._id,
            social: s.social,
            socialLink: s.socialLink
        }));

        const addedSocials = await Social.insertMany(socialLinksToAdd);

        return res.status(201).json({ addedSocials, success: true });
    } catch (error) {
        console.error("error", error);
        return res.status(400).json({ message: error.message, success: false });
    }
},

    
     getSocials : async (req, res) => {
        try {
                const artist = await Artist.findOne({ userId: req.token._id });
                if (!artist) {
                    return res.status(404).json({ msg: "Artist not found", success: false });
                }
                const socials = await Social.find({artist_id:artist._id})
                return res.status(200).send(socials)
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    },  
    updateSocial: async(req,res)=>{
        const eventId = req.params.id
        try {
            const { social,socialLink} = req.body;
                
            const updatedSocial = await Social.findByIdAndUpdate(req.params.id, { social, socialLink }, { new: true });
                return res.status(200).send(updatedSocial)

        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    deleteSocial: async(req,res)=>{
        try {
            const eventId = req.params.id;
      const photo = await Social.findByIdAndDelete(eventId);

    return  res.status(200).json({ message: 'social deleted' });
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    }
}