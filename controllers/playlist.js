const Playlist = require("../models/playlist")
const Song = require('../models/song');
const Audio = require('../models/audio');
const Video = require('../models/video');

module.exports = {
    createPlaylist: async(req,res)=>{
        const user_id = req.token._id;
        const { title, song_id } = req.body;  // song_id is optional
    
        try {
             // Check for existing playlist with the same title for this user
        const existingPlaylist = await Playlist.findOne({ user_id, title });
        if (existingPlaylist) {
            return res.status(409).json({
                msg: "You already have a playlist with this title",
                success: false
            });
        }
            if (!title) {
                return res.status(400).json({
                    msg: "Please provide a playlist title",
                    success: false
                });
            }
    // Validate ObjectIds
const areValidObjectIds = (ids) => ids.every(id => mongoose.Types.ObjectId.isValid(id));
            // Validate song IDs if provided
            if (song_id && !areValidObjectIds(song_id)) {
                return res.status(400).json({
                    msg: "Invalid song IDs provided",
                    success: false
                });
            }
    
            // Optional: Check if all provided song IDs exist in the database
            if (song_id && song_id.length) {
                const songCount = await Song.countDocuments({_id: { $in: song_id }});
                if (songCount !== song_id.length) {
                    return res.status(400).json({
                        msg: "One or more song IDs do not exist",
                        success: false
                    });
                }
            }
    
            const newPlaylist = new Playlist({
                user_id,
                title,
                song_id: song_id || []
            });
    
            await newPlaylist.save();
            return res.status(201).json({ message: "Playlist created", success: true });
        } catch (error) {
            console.error('Error creating playlist:', error);
            return res.status(500).send({ message: 'Error creating playlist', error: error.message });
        }
    },
    updatePlaylist: async(req, res) => {
        const { playlistId } = req.params;
        const { addSongs, removeSongs } = req.body; // Arrays of song IDs to add or remove
    
        try {
            const playlist = await Playlist.findById(playlistId);
            if (!playlist) {
                return res.status(404).json({ message: "Playlist not found", success: false });
            }
    
            // Ensure the user updating the playlist is the owner
            if (playlist.user_id.toString() !== req.token._id) {
                return res.status(403).json({ message: "Unauthorized to modify this playlist", success: false });
            }
    
            // Add songs to the playlist, avoiding duplicates
            if (addSongs && addSongs.length) {
                playlist.song_id = [...new Set([...playlist.song_id, ...addSongs])];
            }
    
            // Remove songs from the playlist
            if (removeSongs && removeSongs.length) {
                playlist.song_id = playlist.song_id.filter(id => !removeSongs.includes(id.toString()));
            }
    
            await playlist.save();
            return res.status(200).json({ message: "Playlist updated", success: true, playlist });
        } catch (error) {
            console.error('Error updating playlist:', error);
            return res.status(500).send({ message: 'Error updating playlist', error: error.message });
        }
    },
    getPlaylists:async(req,res)=>{
        const userId = req.token._id
    try {
        // Fetch all playlists for the user and populate song details
        const playlists = await Playlist.find({ user_id: userId })
            .populate({
                path: 'song_id',
                populate: { // Nested populate to get additional details if needed
                    path: 'genre_id', // Assuming you want to get genre details
                    model: 'Genre'
                }
            });

        if (playlists.length === 0) {
            return res.status(404).json({ message: 'No playlists found for this user.',success:false });
        }

        res.status(200).json({playlists:playlists,success:true});
    } catch (error) {
        console.error('Error retrieving playlists:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message ,success:false});
    }
    },
    getSinglePlaylist: async (req, res) => {
        const id = req.params.id;
    
        try {
            // Fetch the playlist along with song details and their genres
            const playlist = await Playlist.findById(id)
                .populate({
                    path: 'song_id',
                    populate: {
                        path: 'genre_id',
                        model: 'Genre'
                    }
                });
    
            if (!playlist) {
                return res.status(404).json({ message: 'Playlist not found.' ,success:false});
            }
    
            console.log("Playlist:", playlist);
    
            // If there are no songs in the playlist, return early
            if (playlist.song_id.length === 0) {
                return res.status(200).json(playlist);
            }
    
            // Extract song IDs from the playlist
            const songIds = playlist.song_id.map(song => song._id.toString());
    
            // Fetch audio and video details for songs in this playlist
            const audios = await Audio.find({ song_id: { $in: songIds } });
            const videos = await Video.find({ song_id: { $in: songIds } });
    
            // Maps to associate song IDs with their respective audio and video
            const audioMap = audios.reduce((map, audio) => {
                map[audio.song_id.toString()] = audio;
                return map;
            }, {});
    
            const videoMap = videos.reduce((map, video) => {
                map[video.song_id.toString()] = video;
                return map;
            }, {});
    
            // Enrich songs with their audio and video details
            const enrichedSongs = playlist.song_id.map(song => ({
                ...song._doc,
                audio: audioMap[song._id.toString()],
                video: videoMap[song._id.toString()]
            }));
    
            // Update the playlist with enriched songs
            const enrichedPlaylist = {
                ...playlist._doc,
                song_id: enrichedSongs
            };
    
           return res.status(200).json({playlist:enrichedPlaylist,success:true});
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).send({ message: 'Internal server error', error: error.message,success:false });
        }
    },    
    deletePlaylist: async(req,res)=>{
        const { id } = req.params;
        const userId = req.token._id; // Assuming you're using some form of auth and token management
    
        try {
            // Find the playlist to ensure it belongs to the user making the request
            const playlist = await Playlist.findOne({ _id: id, user_id: userId });
            if (!playlist) {
                return res.status(404).json({ message: "Playlist not found or access denied.",success:false });
            }
    
            // If the playlist is found and the user is authorized, delete it
            await Playlist.deleteOne({ _id: id });
            return res.status(200).json({ message: "Playlist successfully deleted.", success:true});
        } catch (error) {
            console.error('Error deleting playlist:', error);
            return res.status(500).json({ message: 'Internal server error', error: error.message ,success:false});
        }
    }
}