const LikedSongs = require("../models/likedSongs")
const Album = require("../models/album");
const Song = require("../models/song")
const Audio = require("../models/audio")
const Video = require("../models/video")

module.exports={
    likeSong: async(req,res)=>{
        const userId = req.token._id
        try {
            if (!req.body.song_id || !req.body.album_id) {
                return res.status(400).json({
                    msg: "Please provide a song and album",
                    success: false,
                });
            }
            const userAlbum = new LikedSongs({
                user_id: userId,
                song_id: req.body.song_id,
                album_id:req.body.album_id
            });
            
            const savedUserAlbum = await userAlbum.save();
            return res.status(201).json({message:"Song liked", success:true});
        } catch (error) {
            console.log("error", error);
        return res.status(500).json({
            msg: "Failed to add user",
            error: error.message || "Something went wrong.",
            success: false,
        });
        }
    },
    getAllLikedSongs : async (req, res) => {
        const userId = req.token._id;
        try {
            const userSongs = await LikedSongs.find({ user_id: userId });
            if (!userSongs) {
                return res.status(400).json({
                    msg: "No liked Songs Found",
                    success: false,
                });
            }
    
            // Properly extract song IDs
            const songIds = userSongs.flatMap(song => song.song_id);
    
            // Fetch audio and video details for these song IDs
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
    
            // Enhance the songs with audio and video details
        const enhancedSongs = userSongs.map(song => ({
            ...song._doc,
            albumid:song.album_id,
            audio: audioMap[song.song_id.toString()],
            video: videoMap[song.song_id.toString()]
        }));
    
            return res.status(200).json({ songs: enhancedSongs, success: true });
        } catch (error) {
            console.error("Error fetching liked songs:", error);
            return res.status(500).json({
                msg: "Failed to fetch liked songs",
                error: error.message || "Something went wrong.",
                success: false,
            });
        }
    },
    removeFromLikeSong:async(req,res)=>{
        const { id } = req.params;
        const userId = req.token._id

    try {
        // Attempt to find and remove the document matching both user ID and song ID
        const result = await LikedSongs.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: 'No such liked song found', success: false });
        }

       return res.status(200).json({ message: 'Liked song removed successfully', success: true });
    } catch (error) {
        console.error('Error removing liked song:', error);
      return  res.status(500).json({ message: 'Failed to remove liked song', error: error.message || 'Something went wrong.', success: false });
    }
    }    
}