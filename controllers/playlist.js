const Playlist = require("../models/playlist")
const Song = require('../models/song');
const Audio = require('../models/audio');
const Video = require('../models/video');
const Album = require("../models/album")

module.exports = {
    createPlaylist: async (req, res) => {
        const user_id = req.token._id;
        const { title, songs=[] } = req.body;  // songs is an array of {songId, albumId}
        console.log("here",songs)
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

            let songIds = [];
        let albumIds = [];

            if (songs.length > 0) {
            // Extract songIds and albumIds
             songIds = songs.map(song => song.songId);
             albumIds = songs.map(song => song.albumId);
            console.log("songs",songIds)
            console.log("albums",albumIds)
            // Optional: Check if all provided song IDs and album IDs exist in the database
            const songCount = await Song.countDocuments({ _id: { $in: songIds } });
            const albumCount = await Album.countDocuments({ _id: { $in: albumIds } });

            }
            const newPlaylist = new Playlist({
                user_id,
                title,
                songs
            });

            await newPlaylist.save();
            return res.status(201).json({ message: "Playlist created", success: true });
        } catch (error) {
            console.error('Error creating playlist:', error);
            return res.status(500).send({ message: 'Error creating playlist', error: error.message });
        }
    }
    ,
    updatePlaylist: async (req, res) => {
        const { playlistId } = req.params;
        const { addSongs, removeSongs } = req.body; // Arrays of objects to add or remove

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
                const existingSongIds = new Set(playlist.songs.map(song => `${song.songId.toString()}_${song.albumId.toString()}`));
                addSongs.forEach(song => {
                    const songKey = `${song.songId}_${song.albumId}`;
                    if (!existingSongIds.has(songKey)) {
                        playlist.songs.push({ songId: song.songId, albumId: song.albumId });
                        existingSongIds.add(songKey);
                    }
                });
            }

            // Remove songs from the playlist
            if (removeSongs && removeSongs.length) {
                const removeSongKeys = new Set(removeSongs.map(song => `${song.songId}_${song.albumId}`));
                playlist.songs = playlist.songs.filter(song => !removeSongKeys.has(`${song.songId.toString()}_${song.albumId.toString()}`));
            }

            await playlist.save();
            return res.status(200).json({ message: "Playlist updated", success: true, playlist });
        } catch (error) {
            console.error('Error updating playlist:', error);
            return res.status(500).send({ message: 'Error updating playlist', error: error.message });
        }
    },

    getPlaylists: async (req, res) => {
        const userId = req.token._id
        try {
            // Fetch all playlists for the user and populate song details
            const playlists = await Playlist.find({ user_id: userId })
                .populate({
                    path: 'songs.songId',
                    populate: { // Nested populate to get additional details if needed
                        path: 'genre_id', // Assuming you want to get genre details
                        model: 'Genre'
                    }
                });

            if (playlists.length === 0) {
                return res.status(404).json({ message: 'No playlists found for this user.', success: false });
            }

            return res.status(200).json({ playlists: playlists, success: true });
        } catch (error) {
            console.error('Error retrieving playlists:', error);
            return res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
        }
    },
    getSinglePlaylist: async (req, res) => {
        const id = req.params.id;
    
        try {
            // Fetch the playlist along with song details, their genres, and albums
            const playlist = await Playlist.findById(id)
            .populate({
                path: 'songs.songId', // Populates song details
                populate: {
                    path: 'genre_id',
                    model: 'Genre'
                }
            })
            .populate({  // Correct population for album
                path: 'songs.albumId',
                model: 'Album'
            });
    
            if (!playlist) {
                return res.status(404).json({ message: 'Playlist not found.', success: false });
            }
    
            // If there are no songs in the playlist, return early
            if (playlist.songs.length === 0) {
                return res.status(200).json({ playlist, success: true });
            }
    
            // Extract song IDs from the playlist
            const songIds = playlist.songs.map(song => song.songId._id.toString());
    
            // Fetch audio and video details for songs in this playlist
            const audios = await Audio.find({ song_id: { $in: songIds } });
            const videos = await Video.find({ song_id: { $in: songIds } });
    
            // Enrich songs with their audio, video details, and album details
            const enrichedSongs = playlist.songs.map(song => ({
                ...song.songId._doc,
                album: song.albumId,
                audio: audios.find(audio => audio.song_id.toString() === song.songId._id.toString()),
                video: videos.find(video => video.song_id.toString() === song.songId._id.toString())
            }));
    
            // Separate the songs based on song_type
            const audioSongs = enrichedSongs.filter(song => song.song_type === 'audio');
            const videoSongs = enrichedSongs.filter(song => song.song_type === 'video');
    
            // Structure the final playlist response
            const finalPlaylist = {
                _id: playlist._id,
                user_id: playlist.user_id,
                AudioSongs: audioSongs.length ? audioSongs : [], // Return empty array if no audio songs are found
                VideoSongs: videoSongs.length ? videoSongs : [], // Return empty array if no video songs are found
                title: playlist.title,
                createdAt: playlist.createdAt,
                updatedAt: playlist.updatedAt,
                __v: playlist.__v
            };
    
            return res.status(200).json({ playlist: finalPlaylist, success: true });
        } catch (error) {
            console.error('Server error:', error);
            res.status(500).send({ message: 'Internal server error', error: error.message, success: false });
        }
    },
      
       

    deletePlaylist: async (req, res) => {
        const { id } = req.params;
        const userId = req.token._id; // Assuming you're using some form of auth and token management

        try {
            // Find the playlist to ensure it belongs to the user making the request
            const playlist = await Playlist.findOne({ _id: id, user_id: userId });
            if (!playlist) {
                return res.status(404).json({ message: "Playlist not found or access denied.", success: false });
            }

            // If the playlist is found and the user is authorized, delete it
            await Playlist.deleteOne({ _id: id });
            return res.status(200).json({ message: "Playlist successfully deleted.", success: true });
        } catch (error) {
            console.error('Error deleting playlist:', error);
            return res.status(500).json({ message: 'Internal server error', error: error.message, success: false });
        }
    }
}