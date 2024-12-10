const Album = require("../models/album")
const Song = require("../models/song")
const Audio = require("../models/audio")
const Video = require("../models/video")
module.exports = {
    createAlbum: async(req,res)=>{
        const { artist_id, songs_id, title, release_date, cover_image } = req.body;

   // Simplified validation checks
   if (!Array.isArray(artist_id)) {
    return res.status(400).send({ message: 'Invalid or missing artist_id. Must be an array.' });
}
if (!Array.isArray(songs_id)) {
    return res.status(400).send({ message: 'Invalid or missing songs_id. Must be an array.' });
}
if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).send({ message: 'Invalid or missing title.' });
}
if (!release_date || isNaN(new Date(release_date).getTime())) {
    return res.status(400).send({ message: 'Invalid or missing release_date. Must be a valid date.' });
}
        try {
            const album = new Album({
                artist_id,
                songs_id,
                title,
                release_date,
                cover_image: cover_image || null
            });
            await album.save();
            res.status(201).send(album);
        } catch (error) {
            res.status(500).send({ message: 'Server error', error });
        }
    },
    getAlbums: async(req,res)=>{
        try {
            const albums = await Album.find({})
                .populate('songs_id')
                .populate({
                    path: 'artist_id',  // Correctly accessing the array of artist IDs
                    model: 'Artist' ,
                    populate:{
                        path: 'userId',   // The field in Artist schema that references Dashboarduser
                        model: 'Dashboarduser' 
                    }    // Explicitly specifying the model might help if the ref is not being recognized
                  })
    
            const songIds = albums.map(album => album.songs_id.map(song => song._id)).flat();
    
            const audios = await Audio.find({ song_id: { $in: songIds } });
            const videos = await Video.find({ song_id: { $in: songIds } });
    
            // Optional: Transform the data to include audio and video details directly within each song object
            const audioMap = audios.reduce((map, audio) => {
                map[audio.song_id] = audio;
                return map;
            }, {});
    
            const videoMap = videos.reduce((map, video) => {
                map[video.song_id] = video;
                return map;
            }, {});
    
            const enhancedAlbums = albums.map(album => ({
                ...album._doc,
                songs_id: album.songs_id.map(song => ({
                    ...song._doc,
                    audio: audioMap[song._id],
                    video: videoMap[song._id]
                }))
            }));
    
           return res.status(200).json(enhancedAlbums);
        } catch (error) {
            res.status(500).send({ message: 'Error fetching albums', error: error.message });
        }
    },
     getSingleAlbum: async (req, res) => {
        const { albumId } = req.params;
        try {
            const album = await Album.findById(albumId)
            .populate('songs_id')
            .populate({
                path: 'artist_id',  // Correctly accessing the array of artist IDs
                model: 'Artist' ,
                populate:{
                    path: 'userId',   // The field in Artist schema that references Dashboarduser
                    model: 'Dashboarduser' 
                }    // Explicitly specifying the model might help if the ref is not being recognized
              })
    
            if (!album) {
                return res.status(404).send({ message: 'No album found with that ID' });
            }
    
            console.log(album);
    
            // Extract song IDs from the single album
            const songIds = album.songs_id.map(song => song._id);
    
            // Fetch audio and video details for songs in this album
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
    
            // Enhance the album's songs with audio and video details
            const enhancedSongs = album.songs_id.map(song => ({
                ...song._doc,
                audio: audioMap[song._id.toString()],
                video: videoMap[song._id.toString()]
            }));
    
            // Return the enhanced album
            const enhancedAlbum = {
                ...album._doc,
                songs_id: enhancedSongs
            };
    
            res.status(200).json(enhancedAlbum);
        } catch (error) {
            console.error('Error fetching album:', error);
            res.status(500).send({ message: 'Error fetching album', error: error.message });
        }
    },
}