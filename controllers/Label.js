const Song = require("../models/song")
const Audio = require("../models/audio")
const Video = require("../models/video")
const Artist = require("../models/artist")
const Admin = require("../models/dashboardUsers")
const Album = require("../models/album")
const Photo = require("../models/photo")
const {sendArtistInvite}=require("../utils/index")
let bcrypt = require("bcrypt");
const crypto = require('crypto');

let methods = {
    createSong: async(req,res)=>{
        // const label_id = req.token._id
        let label_id
        const userRole = req.token.role.toString().toUpperCase();
    if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
      if (userRole === 'LABEL') {
          // Directly use the user's ID if the role is LABEL
          label_id = req.token._id;
      } else if (userRole === 'LABEL_STAFF') {
          // Find the label ID from the createdBy if the role is LABEL_STAFF
          const labelUser = await Dashboarduser.findById(req.token.createdBy);
          label_id = labelUser ? labelUser.createdBy : null;  // Ensure that createdBy points to the LABEL's ID
      }
  }
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
            let label_id
            const userRole = req.token.role.toString().toUpperCase();
        if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
          if (userRole === 'LABEL') {
              // Directly use the user's ID if the role is LABEL
              label_id = req.token._id;
          } else if (userRole === 'LABEL_STAFF') {
              // Find the label ID from the createdBy if the role is LABEL_STAFF
              const labelUser = await Dashboarduser.findById(req.token.createdBy);
              label_id = labelUser ? labelUser.createdBy : null;  // Ensure that createdBy points to the LABEL's ID
          }
      }
            // Fetch all songs associated with this LABEL
            const songs = await Song.find({ label_id: label_id }).populate('genre_id', 'name');
    
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
    
                // Attach audio and video records to the song object only if they exist
            if (audios.length > 0) {
              songObject.audios = audios;
          }
          if (videos.length > 0) {
              songObject.videos = videos;
          }
                return songObject;
            }));
    
           return res.json(songsWithMedia);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "An error occurred while fetching songs." });
        }
    },
    updateSong: async(req,res)=>{
        let label_id
        const userRole = req.token.role.toString().toUpperCase();
    if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
      if (userRole === 'LABEL') {
          // Directly use the user's ID if the role is LABEL
          label_id = req.token._id;
      } else if (userRole === 'LABEL_STAFF') {
          // Find the label ID from the createdBy if the role is LABEL_STAFF
          const labelUser = await Dashboarduser.findById(req.token.createdBy);
          label_id = labelUser ? labelUser.createdBy : null;  // Ensure that createdBy points to the LABEL's ID
      }
  }
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
    },
    getLabelArtists: async(req,res)=>{
      let label_id
      const userRole = req.token.role.toString().toUpperCase();
  if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
    if (userRole === 'LABEL') {
        // Directly use the user's ID if the role is LABEL
        label_id = req.token._id;
    } else if (userRole === 'LABEL_STAFF') {
        // Find the label ID from the createdBy if the role is LABEL_STAFF
        const labelUser = await Dashboarduser.findById(req.token.createdBy);
        label_id = labelUser ? labelUser.createdBy : null;  // Ensure that createdBy points to the LABEL's ID
    }
}
      try {
        const artists = await Artist.find({ label_id: label_id })
            .populate('userId')  // Assuming you might also want to populate the Dashboarduser reference in userId
            .populate('label_id', 'name email')  // Optionally, populate only specific fields from the label
            .exec();
return res.status(200).send(artists)
    } catch (error) {
        console.error('Error fetching artists:', error);
        throw error; // or handle error as appropriate
    }
    },
  getSingleArtist : async (req, res) => {
      const { artistId } = req.params;
  
      try {
          const artist = await Artist.findById(artistId)
              .populate({
                  path: 'userId',
                  model: 'Dashboarduser'
              });
  
          if (!artist) {
              return res.status(404).send({ message: 'No artist found with the provided ID' });
          }
  
          // Fetch albums where this artist is referenced
          const albums = await Album.find({ artist_id: artist._id })
              .populate('songs_id')
              .populate({
                  path: 'artist_id',  
                  populate: {
                      path: 'userId',   
                      model: 'Dashboarduser' 
                  }
              });
  
          // Get all song IDs from the albums to fetch associated audios and videos
          const songIds = albums.flatMap(album => album.songs_id.map(song => song._id));
  
          const audios = await Audio.find({ song_id: { $in: songIds } });
          const videos = await Video.find({ song_id: { $in: songIds } });
  
          // Create maps to easily link audios and videos with their respective songs
          const audioMap = audios.reduce((map, audio) => {
              map[audio.song_id.toString()] = audio;
              return map;
          }, {});
  
          const videoMap = videos.reduce((map, video) => {
              map[video.song_id.toString()] = video;
              return map;
          }, {});
  
          // Enhance albums with audios and videos information
          const enhancedAlbums = albums.map(album => ({
              ...album._doc,
              songs_id: album.songs_id.map(song => ({
                  ...song._doc,
                  audio: audioMap[song._id.toString()],
                  video: videoMap[song._id.toString()]
              }))
          }));
  
          // Return the artist data along with the enhanced albums
          res.status(200).send({ artist, albums: enhancedAlbums });
      } catch (error) {
          console.error('Error fetching artist and albums:', error);
          res.status(500).send({ message: 'Internal server error', error });
      }
  },
  updateArtist: async(req,res)=>{
    const { id } = req.params;

    try {
      const {name,bio,profile_picture}=req.body
        const updatedArtist = await Artist.findByIdAndUpdate(id,req.body, { new: true});
        if (!updatedArtist) {
            return res.status(404).send({ message: 'Artist not found' });
        }
        res.status(200).send(updatedArtist);
    } catch (error) {
        res.status(400).send({ message: 'Error updating artist', error: error.message });
    }
  },
  deleteArtist: async(req,res)=>{
    const { id } = req.params;

    try {
        const artist = await Artist.findById(id);
        if (!artist) {
            return res.status(404).send({ message: 'Artist not found' });
        }

        // Delete the Dashboarduser associated with the artist
        if (artist.userId) {
            await Admin.findByIdAndDelete(artist.userId);
        }

        // Remove artist from albums
        await Album.updateMany(
            { artist_id: artist._id },
            { $pull: { artist_id: artist._id } }
        );

        // Finally, delete the artist
        await Artist.findByIdAndDelete(id);

        res.status(200).send({ message: 'Artist and associated data deleted successfully' });
    } catch (error) {
        console.error('Failed to delete artist and associated data:', error);
        res.status(500).send({ message: 'Error deleting artist', error });
    }
  },
  deleteSong: async(req,res)=>{
    const { songId } = req.params;

    try {
        // Delete the song document
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).send({ message: 'Song not found' });
        }

        // Remove the song's ID from any albums
        await Album.updateMany(
            { songs_id: song._id },
            { $pull: { songs_id: song._id } }
        );

        // Delete associated Audio documents
        await Audio.deleteMany({ song_id: song._id });

        // Delete associated Video documents
        await Video.deleteMany({ song_id: song._id });
         // Finally, delete the artist
         await Song.findByIdAndDelete(songId);
      return  res.status(200).send({ message: 'Song and all associated data deleted successfully' });
    } catch (error) {
        console.error('Failed to delete song and associated data:', error);
       return res.status(500).send({ message: 'Error deleting song', error });
    }
  },
  createPhoto: async(req,res)=>{
    try {
      let label_id
      const userRole = req.token.role.toString().toUpperCase();
  if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
    if (userRole === 'LABEL') {
        // Directly use the user's ID if the role is LABEL
        label_id = req.token._id;
    } else if (userRole === 'LABEL_STAFF') {
        // Find the label ID from the createdBy if the role is LABEL_STAFF
        const labelUser = await Dashboarduser.findById(req.token.createdBy);
        label_id = labelUser ? labelUser.createdBy : null;  // Ensure that createdBy points to the LABEL's ID
    }
}
      console.log("Label ID:", label_id);
  
      // Check if the incoming data is an array
      if (!Array.isArray(req.body.photos)) {
          return res.status(400).json({ message: "Photos must be an array." });
      }
  
      const photosArray = req.body.photos; // Expect an array of photo objects
  
      // Use map() to create an array of new Photo instances
      const photoInstances = photosArray.map(photo => {
          return new Photo({
              img_url: photo.img_url,
              title: photo.title,
              label_id: label_id
          });
      });
  
      // Use Promise.all to save all Photo instances concurrently
      const savedPhotos = await Promise.all(photoInstances.map(photo => photo.save()));
      return res.status(201).json(savedPhotos);
  } catch (error) {
      return res.status(400).json({ message: error.message });
  }
  
  },
  getPhotos: async(req,res)=>{
    let label_id
    const userRole = req.token.role.toString().toUpperCase();
if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
  if (userRole === 'LABEL') {
      // Directly use the user's ID if the role is LABEL
      label_id = req.token._id;
  } else if (userRole === 'LABEL_STAFF') {
      // Find the label ID from the createdBy if the role is LABEL_STAFF
      const labelUser = await Dashboarduser.findById(req.token.createdBy);
      label_id = labelUser ? labelUser.createdBy : null;  // Ensure that createdBy points to the LABEL's ID
  }
}
    try {
      const photos = await Photo.find({label_id});
      return res.status(200).json(photos);
  } catch (error) {
      return res.status(500).json({ message: error.message });
  }
  },
  getSinglePhoto: async(req,res)=>{
    try {
      const photo = await Photo.findById(req.params.id);
      if (photo) {
       return   res.status(200).json(photo);
      } else {
        return  res.status(404).json({ message: 'Photo not found' });
      }
  } catch (error) {
     return res.status(500).json({ message: error.message });
  }
  },
  updatePhoto: async(req,res)=>{
    try {

      const updatedPhoto = await Photo.findByIdAndUpdate(req.params.id, req.body, { new: true });
     return res.status(200).json(updatedPhoto);
  } catch (error) {
     return res.status(400).json({ message: error.message });
  }
  },
  deletePhoto: async(req,res)=>{
    try {
      const photoId = req.params.id;
      const photo = await Photo.findByIdAndDelete(photoId);

      if (!photo) {
          return res.status(404).json({ message: 'Photo not found' });
      }

      // Update albums to remove deleted photo reference
      await Album.updateMany(
          { photos_id: photoId },
          { $pull: { photos_id: photoId } }
      );

    return  res.status(200).json({ message: 'Photo deleted' });
  } catch (error) {
    return  res.status(500).json({ message: error.message });
  }
  }
}

module.exports = methods;