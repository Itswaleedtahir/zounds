const Artists = require("../models/artist");
const Album = require("../models/album");
const Song = require("../models/song");
const Audio = require("../models/audio");
const Video = require("../models/video");
module.exports = {
 getArtist: async(req,res)=>{
    try {
        const artists = await Artists.find({});
        return res.status(200).json({
            success: true,
            count: artists.length,
            data: artists
        });
    } catch (error) {
        console.error("Error retrieving all artists:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
 },
 getRecentArtists: async(req,res)=>{
    try {
        // Assuming 'createdAt' is the field for storing when the artist was added
        const artists = await Artists.find({}).sort({ createdAt: -1 }).limit(3);
        return res.status(200).json({
            success: true,
            count: artists.length,
            data: artists
        });
    } catch (error) {
        console.error("Error retrieving recent artists:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
 },
 getSingleArtist: async(req,res)=>{
    try {
        const { id } = req.params;
        const artist = await Artists.findById(id);

        if (!artist) {
            return res.status(404).json({
                success: false,
                message: 'Artist not found'
            });
        }

        // Fetch albums associated with the artist
        const albums = await Album.find({ artist_id: artist._id }).lean();
        
        // Iterate over each album to fetch associated songs
        for (let album of albums) {
            const songs = await Song.find({ album_id: album._id }).lean();

            // For each song, fetch associated audio and video
            for (let song of songs) {
                const audios = await Audio.find({ song_id: song._id });
                const videos = await Video.find({ song_id: song._id });

                // Attach audio and video records to the song object
                song.audios = audios;
                song.videos = videos;
            }

            // Attach songs to the album object
            album.songs = songs;
        }

        // Attach albums to the artist response
        artist._doc.albums = albums; // Use _doc to modify the mongoose document directly

        return res.status(200).json({
            success: true,
            data: artist
        });
    } catch (error) {
        console.error("Error retrieving artist and related data:", error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
 },
};
