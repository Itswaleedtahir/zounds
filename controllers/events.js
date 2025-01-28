const Events = require("../models/event")
const Artist = require("../models/artist")
const Dashboarduser = require("../models/dashboardUsers")
module.exports = {
    createEvents : async (req, res) => {
        try {
            const { title, venue,date,time,shopLink,description ,image, isActive } = req.body;
            if (!title || !venue || !date || !time || !shopLink || !description) {
                return res.status(400).json({ msg: "Please provide Event content", success: false });
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
            const eventAdd = new Events({
                label_id: req.token.role === 'LABEL' || req.token.role==="LABEL_STAFF"? label_id : null,
                artist_id: artist ? artist._id : req.body.artist_id,  // Use found artist ID or expect it from body for labels
                title: title,
                venue: venue,
                date:date,
                isActive:isActive,
                time:time,
                shopLink:shopLink,
                description:description,
                image: image
            });
    
            const savedEvent = await eventAdd.save();
         return   res.status(201).json(savedEvent);
        } catch (error) {
            console.log("error",error)
         return   res.status(400).json({ message: error.message });
        }
    },
     getEvents : async (req, res) => {
        try {
            if (req.token.role === 'ARTIST') {
                const artist = await Artist.findOne({ userId: req.token._id });
                if (!artist) {
                    return res.status(404).json({ msg: "Artist not found", success: false });
                }
                const event = await Events.find({artist_id:artist._id})
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
        const eventItems = await Events.find({ artist_id: { $in: artistIds } }).populate('artist_id');
        if (!eventItems.length) {
            return res.status(404).json({ msg: "No news items found for these artists", success: false });
        }

       return res.status(200).json(eventItems);
            }

        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    },  
    updateEvents: async(req, res) => {
        const eventId = req.params.id;
        try {
            const { title, venue, date, time, description, shopLink, image, isActive } = req.body;
            const eventItem = await Events.findOne({_id: eventId});
    
            // Explicitly check if each property is provided before updating
            if (title !== undefined) eventItem.title = title;
            if (venue !== undefined) eventItem.venue = venue;
            if (date !== undefined) eventItem.date = date;
            if (time !== undefined) eventItem.time = time;
            if (description !== undefined) eventItem.description = description;
            if (shopLink !== undefined) eventItem.shopLink = shopLink;
            if (image !== undefined) eventItem.image = image;
            if (isActive !== undefined) eventItem.isActive = isActive;
    
            const updatedEvent = await eventItem.save();
            return res.status(200).send(updatedEvent);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    deleteEvents: async(req,res)=>{
        try {
            const eventId = req.params.id;
      const photo = await Events.findByIdAndDelete(eventId);

    return  res.status(200).json({ message: 'news deleted' });
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    }
}