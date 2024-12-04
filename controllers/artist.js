const Artists = require("../models/artist");
const Album = require("../models/album");
const Song = require("../models/song");
const Audio = require("../models/audio");
const Video = require("../models/video");
module.exports = {
 createArtist: async(req,res)=>{
    try {
        const { name, bio, profile_picture } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                msg: "Name is required",
                success: false,
            });
        }

        // Assuming `Artists` is the Mongoose model for the artists collection
        const newArtist = new Artists({
            name,
            bio,
            profile_picture
        });

        // Save the new artist document to MongoDB
        await newArtist.save();

        return res.status(201).json({
            msg: "Artist created successfully",
            success: true,
            data: newArtist
        });
    } catch (error) {
        console.error("Error creating artist:", error);
        return res.status(500).json({
            msg: error.message || "An error occurred while creating the artist",
            success: false,
        });
    }
 },
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
        // Calculate the time 5 hours ago from now
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

        // Fetch artists created within the last 5 hours
        const recentArtists = await Artists.find({
            createdAt: { $gte: fiveHoursAgo }
        });

        return res.status(200).json({
            success: true,
            count: recentArtists.length,
            data: recentArtists
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
 createAlbum: async(req,res)=>{
    try {
        const { artist_id, title, release_date, cover_image, genre, category } = req.body;

        // Validate required fields
        if (!artist_id || !title || !release_date || !genre || !category) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields (artist_id, title, release_date, genre, category)"
            });
        }

        // Create a new album
        const newAlbum = new Album({
            artist_id,
            title,
            release_date,
            cover_image,
            genre,
            category
        });

        // Save the album document to MongoDB
        await newAlbum.save();

        return res.status(201).json({
            success: true,
            message: 'Album created successfully',
            data: newAlbum
        });
    } catch (error) {
        console.error("Error creating album:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
 },
 createSong: async(req,res)=>{
    try {
        const { album_id, title, duration, song_type } = req.body;

        // Validate required fields
        if (!album_id || !title || !duration || !song_type) {
            return res.status(400).json({
                success: false,
                message: "All fields are required (album_id, title, duration, song_type, file_path)"
            });
        }

        // Create a new song document
        const newSong = new Song({
            album_id,
            title,
            duration,
            song_type
        });

        // Save the song document to MongoDB
        await newSong.save();

        return res.status(201).json({
            success: true,
            message: 'Song created successfully',
            data: newSong
        });
    } catch (error) {
        console.error("Error creating song:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
 },
 audioSong: async(req,res)=>{
    try {
        const { song_id, audio_quality, file_path, bit_rate, file_size } = req.body;

        // Validate required fields
        if (!song_id || !audio_quality || !file_path || !bit_rate || !file_size) {
            return res.status(400).json({
                success: false,
                message: "All fields are required (song_id, audio_quality, file_path, bit_rate, file_size)"
            });
        }

        // Create a new audio document
        const newAudio = new Audio({
            song_id,
            audio_quality,
            file_path,
            bit_rate,
            file_size
        });

        // Save the audio document to MongoDB
        await newAudio.save();

        return res.status(201).json({
            success: true,
            message: 'Audio created successfully',
            data: newAudio
        });
    } catch (error) {
        console.error("Error creating audio:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
 }
};
