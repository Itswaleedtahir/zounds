const Genre = require("../models/genre");

module.exports = {
    createGenre: async(req,res)=>{
        try {
            const genres = req.body; // Expected to be an array of genre objects
    
            // Validate input to ensure it's an array and not empty
            if (!Array.isArray(genres) || genres.length === 0) {
                return res.status(400).json({ success: false, message: "Please provide an array of genres" });
            }
    
            // Optionally, add further validation for each genre object
            for (const genre of genres) {
                if (!genre.name) {
                    return res.status(400).json({ success: false, message: "Each genre must have a name" });
                }
            }
    
            // Insert multiple genre documents into the database
            const newGenres = await Genre.insertMany(genres);
    
            return res.status(201).json({
                success: true,
                message: 'Genres created successfully',
                data: newGenres
            });
        } catch (error) {
            console.error("Error creating genres:", error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    },
    getAllGenre: async(req,res)=>{
        try {
            const genres = await Genre.find({});
            return res.status(200).json({
                success: true,
                count: genres.length,
                data: genres
            });
        } catch (error) {
            console.error("Error retrieving genres:", error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
};


