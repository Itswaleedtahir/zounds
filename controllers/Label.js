const Song = require("../models/song")
const Audio = require("../models/audio")
const Video = require("../models/video")
const Admin = require("../models/dashboardUsers")
const {sendArtistInvite}=require("../utils/index")
let bcrypt = require("bcrypt");
const crypto = require('crypto');

let methods = {
    createSong: async(req,res)=>{
        const label_id = req.token._id
        const { genre_id, song_type, mediaFiles } = req.body;
        if(!song_type || !mediaFiles ){
            return res.status(400).json({
                msg: "Please provide song data",
                success: false,
              });
        }
        try {
          // Create and save the song record
          const song = new Song({
            label_id,
            genre_id,
            song_type
          });
      
          const savedSong = await song.save();
      
          // Handle creation of audio or video records based on song_type
          let mediaRecords = [];
          if (song_type === 'audio' && mediaFiles && mediaFiles.length > 0) {
            mediaRecords = mediaFiles.map(file => ({
              song_id: savedSong._id,
              audio_quality: file.audio_quality,
              file_path: file.file_path,
              bit_rate: file.bit_rate,
              title:file.title,
              duration:file.duration,
              file_size: file.file_size
            }));
            await Audio.insertMany(mediaRecords);
          } else if (song_type === 'video' && mediaFiles && mediaFiles.length > 0) {
            mediaRecords = mediaFiles.map(file => ({
              song_id: savedSong._id,
              title: file.title,
              duration: file.duration,
              file_path: file.file_path,
              resolution: file.resolution,
              video_format: file.video_format
            }));
            await Video.insertMany(mediaRecords);
          }
      
         return res.status(201).json({
            message: `Song and associated ${song_type} records created successfully.`,
            song: savedSong,
            media: mediaRecords
          });
        } catch (error) {
          console.error(error);
          res.status(500).send("An error occurred while saving the song and media records.");
        }
    },
    addArtist: async(req,res)=>{
        try {
            let { email, password ,role} = req.body;
            if (!email || !password || !role) {
              return res.status(400).json({
                msg: "Please provide artist data",
                success: false,
              });
            }
            let userData = await Admin.findOne({ email: email });
            if (userData) {
              return res.status(404).json({
                msg: "Artist already exists",
                success: false,
              });
            }
        
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            let admin = new Admin({ email, password: hashedPassword, user_role:role });
            let addUser = await admin.save();
            sendArtistInvite(email,password)
            if (!addUser) {
              return res.status(500).json({
                msg: "Failed to add artist",
                success: false,
              });
            }
        
          return  res.status(200).json({
              user: addUser,
              success: true,
            });
          } catch (error) {
            console.log("error",error)
          return  res.status(500).json({
              msg: "Failed to add user",
              error: error.message || "Something went wrong.",
              success: false,
            });
          }
    },
    getAllSongsOfLabel: async (req, res) => {
        try {
            const userId = req.token._id;
            // Fetch all songs associated with this LABEL
            const songs = await Song.find({ label_id: userId }).populate('genre_id', 'name');
    
            // Use Promise.all to handle multiple asynchronous operations
            const songsWithMedia = await Promise.all(songs.map(async song => {
                // Convert song to a plain object to modify it safely
                const songObject = song.toObject();
                console.log("song",songObject)
                // Fetch associated audios and videos in parallel
                const [audios, videos] = await Promise.all([
                    Audio.find({ song_id: song._id }),
                    Video.find({ song_id: song._id })
                ]);
    
                // Attach audio and video records to the song object
                songObject.audios = audios;
                songObject.videos = videos;
                return songObject;
            }));
    
            res.json(songsWithMedia);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "An error occurred while fetching songs." });
        }
    },
    updateSong: async(req,res)=>{
        const label_id = req.token._id
        const { songId } = req.params;
        const { genre_id, title, song_type, mediaUpdates } = req.body;
        console.log("henre",genre_id)
        try {
            // Find the song by ID and update it
            const song = await Song.findById(songId);
            if (!song) {
                return res.status(404).json({ message: "Song not found." });
            }
            console.log("song",song)
            // Update song properties
            song.label_id =label_id || song.label_id
            song.genre_id = genre_id || song.genre_id;
            song.title = title || song.title;
            song.song_type = song_type || song.song_type;
    
            // Save the updated song
            await song.save();
    
             // Update associated audio records
        if (song_type === 'audio' && mediaUpdates && mediaUpdates.audios) {
            // Update all audio records associated with this song
            await Audio.updateMany({ song_id: song._id }, {
                $set: {
                    audio_quality: mediaUpdates.audios[0].audio_quality,
                    file_path: mediaUpdates.audios[0].file_path,
                    bit_rate: mediaUpdates.audios[0].bit_rate,
                    file_size: mediaUpdates.audios[0].file_size,
                    title: mediaUpdates.audios[0].title,
                    duration: mediaUpdates.audios[0].duration
                }
            });
        }

        // Update associated video records
        if (song_type === 'video' && mediaUpdates && mediaUpdates.videos) {
            // Update all video records associated with this song
            await Video.updateMany({ song_id: song._id }, {
                $set: {
                    title: mediaUpdates.videos[0].title,
                    duration: mediaUpdates.videos[0].duration,
                    file_path: mediaUpdates.videos[0].file_path,
                    resolution: mediaUpdates.videos[0].resolution,
                    video_format: mediaUpdates.videos[0].video_format
                }
            });
        }

            // Respond with the updated song details
            const updatedSong = await Song.findById(songId).populate('genre_id');
           return res.json({ message: "Song and media updated successfully."});
        } catch (error) {
            console.error(error);
           return res.status(500).json({ message: "An error occurred during the update process." });
        }
    }
}

module.exports = methods;