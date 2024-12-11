const News = require("../models/news")
const Artist = require("../models/artist")
module.exports = {
    createNews : async (req, res) => {
        try {
            const { title, news, image } = req.body;
            if (!title || !news) {
                return res.status(400).json({ msg: "Please provide Title and News content", success: false });
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
            const newsAdd = new News({
                label_id: req.token.role === 'LABEL' ? req.token._id : null,
                artist_id: artist ? artist._id : req.body.artist_id,  // Use found artist ID or expect it from body for labels
                title: title,
                news: news,
                image: image
            });
    
            const savedNews = await newsAdd.save();
         return   res.status(201).json(savedNews);
        } catch (error) {
            console.log("error",error)
         return   res.status(400).json({ message: error.message });
        }
    },
     getNews : async (req, res) => {
        try {
            if (req.token.role === 'ARTIST') {
                const artist = await Artist.findOne({ userId: req.token._id });
                if (!artist) {
                    return res.status(404).json({ msg: "Artist not found", success: false });
                }
                const news = await News.find({artist_id:artist._id})
                return res.status(200).send(news)
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
        const newsItems = await News.find({ artist_id: { $in: artistIds } }).populate('artist_id');
        if (!newsItems.length) {
            return res.status(404).json({ msg: "No news items found for these artists", success: false });
        }

       return res.status(200).json(newsItems);
            }

        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    },  
    updateNews: async(req,res)=>{
        const newsId = req.params.id
        try {
            const { title, news, image } = req.body;
                
                const newsItem = await News.findOne({_id:newsId})
                // Update the news item if authorized
        newsItem.title = title || newsItem.title;
        newsItem.news = news || newsItem.news;
        newsItem.image = image || newsItem.image;
        const updatedNews = await newsItem.save();
                return res.status(200).send(updatedNews)


        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },
    deleteNews: async(req,res)=>{
        try {
            const photoId = req.params.id;
      const photo = await News.findByIdAndDelete(photoId);

    return  res.status(200).json({ message: 'news deleted' });
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({ message: error.message });
        }
    }
}