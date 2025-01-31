const Shop = require("../models/shop")
const Artist = require("../models/artist")
const Dashboarduser = require("../models/dashboardUsers")
module.exports = {
    createShop : async (req, res) => {
        try {
            const { title,shopLink,description } = req.body;
            if (!title || !shopLink || !description) {
                return res.status(400).json({ msg: "Please provide Shop details", success: false });
            }
    
            // Assume artist user IDs are stored in the Artist model
            let artist;
            if (req.token.role === 'ARTIST') {
                artist = await Artist.findOne({ userId: req.token._id });
                if (!artist) {
                    return res.status(404).json({ msg: "Artist not found", success: false });
                }
            }
            let artist_id = req.token.role === 'ARTIST' ? artist._id : req.body.artist_id;
            if (req.token.role === 'LABEL' && !artist_id) {
                return res.status(400).json({ msg: "Label must provide an Artist ID", success: false });
            }
            let label_id
            const userRole = req.token.role.toString().toUpperCase();
        if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
          if (userRole === 'LABEL') {
              // Directly use the user's ID if the role is LABEL
              label_id = req.token._id;
          } else if (userRole === 'LABEL_STAFF') {
              // Find the label ID from the createdBy if the role is LABEL_STAFF
              const labelUser = await Dashboarduser.findById(req.token.createdBy);
              label_id = labelUser ? labelUser._id : null; // Ensure that createdBy points to the LABEL's ID
          }
      }
            const shopAdd = new Shop({
                label_id: req.token.role === 'LABEL' || req.token.role==="LABEL_STAFF"? label_id : null,
                artist_id: artist ? artist._id : req.body.artist_id,  // Use found artist ID or expect it from body for labels
                title: title,
                shopLink:shopLink,
                description:description,
            });
    
            const savedShop = await shopAdd.save();
         return   res.status(201).json(savedShop);
        } catch (error) {
            console.log("error",error)
         return   res.status(400).json({ message: error.message });
        }
    },
     getShops : async (req, res) => {
        try {
            if (req.token.role === 'ARTIST') {
                const artist = await Artist.findOne({ userId: req.token._id });
                if (!artist) {
                    return res.status(404).json({ msg: "Artist not found", success: false });
                }
                const event = await Shop.find({artist_id:artist._id})
                return res.status(200).send(event)
            } else if (req.token.role === 'LABEL' || req.token.role === 'LABEL_STAFF') {
                let label_id
            const userRole = req.token.role.toString().toUpperCase();
        if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
          if (userRole === 'LABEL') {
              // Directly use the user's ID if the role is LABEL
              label_id = req.token._id;
          } else if (userRole === 'LABEL_STAFF') {
              // Find the label ID from the createdBy if the role is LABEL_STAFF
              const labelUser = await Dashboarduser.findById(req.token.createdBy);
              label_id = labelUser ? labelUser._id : null;  // Ensure that createdBy points to the LABEL's ID
          }
      }
        // Find all artists created by this label
        const artists = await Artist.find({ label_id: label_id });
        if (!artists.length) {
            return res.status(404).json({ msg: "No artists found for this label", success: false });
        }

        // Extract artist IDs
        const artistIds = artists.map(artist => artist._id);

        // Find all news created by these artists
        const eventItems = await Shop.find({ artist_id: { $in: artistIds } }).populate('artist_id');
        if (!eventItems.length) {
            return res.status(404).json({ msg: "No news items found for these artists", success: false });
        }

       return res.status(200).json({shop:eventItems});
            }

        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    },  
    updateShop: async(req,res)=>{
        const eventId = req.params.id
        try {
            const { title,description,shopLink} = req.body;
                
                const eventItem = await Shop.findOne({_id:eventId})
        eventItem.title = title || eventItem.title;
        eventItem.description = description || eventItem.description;
        eventItem.shopLink = shopLink || eventItem.shopLink;
        const updatedNews = await eventItem.save();
                return res.status(200).send(updatedNews)

        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    deleteShop: async(req,res)=>{
        try {
            const eventId = req.params.id;
      const photo = await Shop.findByIdAndDelete(eventId);

    return  res.status(200).json({ message: 'shop deleted' });
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    }
}