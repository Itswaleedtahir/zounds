const Events = require("../models/event")
const Artist = require("../models/artist")
module.exports = {
    createEvents : async (req, res) => {
        try {
            const { title, venue,date,time,shopLink,description ,image } = req.body;
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
            const eventAdd = new Events({
                label_id: req.token.role === 'LABEL' ? req.token._id : null,
                artist_id: artist ? artist._id : req.body.artist_id,  // Use found artist ID or expect it from body for labels
                title: title,
                venue: venue,
                date:date,
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
            } else if (req.token.role === 'LABEL') {
               // Assume the label's ID is included in the token after authentication
        const labelId = req.token._id;

        // Find all artists created by this label
        const artists = await Artist.find({ label_id: labelId });
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
    updateEvents: async(req,res)=>{
        const eventId = req.params.id
        try {
            const { title, venue, date,time,description,shopLink ,image} = req.body;
                
                const eventItem = await Events.findOne({_id:eventId})
                // Update the news item if authorized
        eventItem.title = title || eventItem.title;
        eventItem.venue = venue || eventItem.venue;
        eventItem.date = date || eventItem.date;
        eventItem.time = time || eventItem.time;
        eventItem.description = description || eventItem.description;
        eventItem.shopLink = shopLink || eventItem.shopLink;
        eventItem.image = image || eventItem.image;
        const updatedNews = await eventItem.save();
                return res.status(200).send(updatedNews)


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