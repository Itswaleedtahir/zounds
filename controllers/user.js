const Users = require("../models/user");
const { generateErrorInstance, sendVerificationEmail, ResendVerificationEmail, sendResetPasswordMail, comparePassword, uploadFile, issueToken } = require("../utils");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const Preference = require("../models/preferences")
const axios = require("axios")
const jwt = require("jsonwebtoken");
const Genre = require("../models/genre");
const preferences = require("../models/preferences");
const DownloadArtist = require("../models/downloadArtist");
const News = require("../models/news");
const Event = require("../models/event");
const Artist = require("../models/artist");
const UserAlbum = require("../models/userAlbums");
const Album = require("../models/album");
const Song = require("../models/song")
const Shop = require("../models/shop")
const Audio = require("../models/audio")
const Video = require("../models/video")
const PlayHistory = require("../models/listeningHistory")
module.exports = {
  addUser: async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ msg: "Please provide user data", success: false });
      }
      let userData = await Users.findOne({ email: email });
      if (userData) {
        return res.status(404).json({ msg: "User already exists", success: false });
      }

      // Generate a 4-digit OTP
      const otp = crypto.randomInt(100000, 999999);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const addUser = new Users({ email, password: hashedPassword, otp, firstName: name });
      await addUser.save();

      // Send the OTP email
      await sendVerificationEmail(email, otp, res);

      return res.status(200).json({ msg: "OTP sent to your email", success: true });
    } catch (error) {
      console.error("error", error);
      return res.status(500).json({ msg: "Failed to add user", error: error.message, success: false });
    }
  },

  verifyUser: async (req, res) => {
    try {
      const { email, otp } = req.body;
      console.log("otp", otp)
      if (!email || !otp) {
        return res.status(400).json({ msg: "Please provide both email and OTP", success: false });
      }
      let user = await Users.findOne({ email });
      console.log("user", user)
      if (!user) {
        return res.status(404).json({ msg: "User not found", success: false });
      }
      if (user.otp !== otp) {
        return res.status(401).json({ msg: "Invalid OTP", success: false });
      }
      user.isVerified = true;
      user.otp = null;
      await user.save();

      return res.status(200).json({ msg: "User verified successfully", success: true });
    } catch (error) {
      return res.status(500).json({ msg: "Failed to verify user", error: error.message, success: false });
    }
  },

  resendOTP: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ msg: "Email is required", success: false });
      }
      let user = await Users.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: "User not found", success: false });
      }
      const newOtp = crypto.randomInt(100000, 999999);
      user.otp = newOtp;
      await user.save();

      // Send the OTP email
      await ResendVerificationEmail(email, newOtp, res);
      return res.status(200).json({ msg: "OTP resent successfully", success: true });
    } catch (error) {
      return res.status(500).json({ msg: "Failed to resend OTP", error: error.message, success: false });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw generateErrorInstance({ success: false, msg: "Required fields can't be empty" });
      }
      let user = await Users.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: "User not found", success: false });
      }
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (!passwordMatched) {
        return res.status(401).send({ success: false, msg: "Invalid Password" });
      }
      let access_token = await issueToken({
        _id: user._id,
        email: user.email,
      });

      return res.status(200).send({ user, access_token, msg: "Login successful", success: true });
    } catch (err) {
      console.error(err);
      return res.status(err.status || 500).send({ message: err.message || "Something went wrong!" });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: "User with this email does not exist", success: false });
      }
      const newOtp = crypto.randomInt(100000, 999999);
      user.otp = newOtp;
      await user.save();

      // Send the reset password email
      sendResetPasswordMail(email, newOtp);

      return res.status(200).json({ msg: "Reset Email has been sent", success: true });
    } catch (error) {
      return res.status(500).json({ msg: error.message || "Something went wrong.", success: false });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await Users.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: "User not found", success: false });
      }
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        return res.status(400).json({ msg: "Old password cannot be set as new password", success: false });
      }
      user.password = await bcrypt.hash(password, 10);
      user.otp = null;
      await user.save();

      return res.status(200).json({ msg: "User Password has been reset", success: true });
    } catch (error) {
      return res.status(500).json({ msg: error.message || "Something went wrong.", success: false });
    }
  },

  fileUploadS3: async (req, res, next) => {
    try {
      console.log("req.files ", req.files);
      let files = req.files.file; // Extract the files object
      if (!files) {
        return res.status(400).json({ success: false, message: "No files uploaded" });
      }
      // Ensure files is always an array
      if (!Array.isArray(files)) {
        files = [files];
      }
      let uploadedFiles = [];
      for (let file of files) {
        console.log("Processing file: ", file);
        // Determine file type based on mimetype
        let typeFile;
        if (file.mimetype.includes("audio")) {
          typeFile = "Audio";
        } else if (
          file.mimetype.includes("application") &&
          !file.mimetype.includes("rar") &&
          !file.mimetype.includes("zip") &&
          !file.name.includes("rar") &&
          !file.name.includes("zip")
        ) {
          typeFile = "Document";
        } else if (file.mimetype.includes("image")) {
          typeFile = "Image";
        } else if (file.mimetype.includes("video")) {
          typeFile = "Video";
        }
        // Upload file to S3 (Public or Private)
        const fileLocation = await uploadFile(
          file,
          req.body.type || "Public"
        );
        console.log("fileLocation ", fileLocation);
        console.log("req.userId ", req.userId);

        let url = fileLocation.Location;
        let urlNew, urlPath;
        if (process.env.CDN_URL) {
          urlNew = url.replace(process.env.S3_URL, process.env.CDN_URL);
          urlNew = urlNew.replace(process.env.S3_URL2, process.env.CDN_URL);
          urlPath = urlNew?.replace(process.env.CDN_URL, "");
        } else {
          urlNew = url;
          urlPath = url;
          urlPath = urlNew.replace(process.env.S3_URL, "");
        }
        console.log("urlNew ", urlNew);
        console.log("urlPath ", urlPath);

        uploadedFiles.push({
          fileLocation: url,
          urlCDN: urlNew,
          urlPath: urlPath,
          typeFile: typeFile,
          success: true,
          message: "File uploaded successfully"
        });
      }
      // Return response with all uploaded file locations
      return res.status(200).json({
        uploadedFiles,
        success: true,
        message: "Files uploaded successfully"
      });
    } catch (error) {
      console.error("Error handling file upload:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error"
      });
    }
  },
  userPrefrences: async (req, res) => {
    try {
      let user_id = req.token._id;
      const { artistsSelected, genreSelected, artistContent } = req.body;
      const { gender, dob, zipcode } = req.body;

      // Find the user and update it
      const user = await Users.findByIdAndUpdate(user_id, {
        $set: {
          gender,
          dob,
          zipcode,
          preferencesSet: true
        }
      }, { new: true, runValidators: true }); // Option "new: true" returns the updated document

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      const newPreference = new Preference({
        user_id,
        artistsSelected, // Array of artist IDs
        genreSelected,   // Array of genre IDs
        artistContent
      });

      await newPreference.save();
      return res.status(201).json({
        success: true,
        message: 'Preference created successfully',
        data: newPreference,
        user: user
      });
    } catch (error) {
      console.error("Error creating preference:", error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  },
  googleVerify: async (req, res) => {
    try {
      const { accessToken } = req.body
      const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      console.log('Response of Google', response.data);
      console.log('Google email is', response.data.email);

      const user = {
        email: response.data.email,
        image: response.data.picture,
        social_id: response.data.id,
        first_name: response.data.given_name,
        last_name: response.data.family_name,
        password: `${response.data.email}_${response.data.id}`
      };
      const findUser = await Users.findOne({
        googleId: user.social_id
      })
      if (findUser) {
        let access_token = await issueToken({
          _id: findUser._id,
          email: findUser.email,
        });
        let result = {
          user: {
            _id: findUser._id,
            email: findUser.email,
            imageUrl: findUser.image,
          }
        };

        return res.status(200).send({ message: "User exist", user: findUser, token: access_token, success: true })
      } else {
        const newUser = new Users({
          email: user.email,
          googleId: user.social_id,
          firstName: user.first_name,
          lastName: user.last_name,
          image: user.image,
          isVerified: true,
          password: user.password
        });

        const savedUser = await newUser.save();
        let access_token = await issueToken({
          _id: savedUser._id,
          email: savedUser.email,
        });
        console.log("user", savedUser)
        let result = {
          user: {
            _id: savedUser._id,
            email: savedUser.email,
            imageUrl: savedUser.image,
          }
        };
        return res.status(201).json({ message: "User created", user: savedUser, token: access_token, success: true });
      }

    } catch (error) {
      console.log('Error', error);
      return res.status(500).send({ message: 'Error', error: error.message });
    }
  },

  appleLogin: async (req, res) => {
    // Function to fetch Apple's public key
    async function fetchApplePublicKey() {
      const url = 'https://appleid.apple.com/auth/keys'; // Apple's public key URL
      const response = await axios.get(url);
      // Further implementation needed to convert the key to a format usable by jwt.verify()
      return response.data.keys[0]; // Simplified, depends on key selection logic
    }
    try {
      const { idToken, appleId, first_name, last_name } = req.body;
      console.log("token", idToken)
      const userData = jwt.decode(idToken)
      console.log("userData", userData)
      const email =
        idToken === null
          ? null
          : jwt.decode(idToken).email == undefined
            ? null
            : jwt.decode(idToken).email;
      // console.log("--> email: ", email);
      console.log("email", email)
      const user = await Users.findOne({
        email: email
      })
      if (user) {
        console.log("insideif")
        const access_token = await issueToken({
          _id: user.id,
          email: user.email,
        });
        let result = {
          user: {
            _id: user._id,
            email: user.email,
            imageUrl: user.image,
          }
        };
        return res.status(200).send({ message: "User exist",user: user ,token: access_token, success: true })

      } else {
        console.log("insideelseeee")
        const newUser = new Users({
          email: userData.email,
          appleId: appleId,
          firstName: first_name ?? null,  // If first_name is null, it defaults to null
          lastName: last_name ?? null,
          image: userData?.image,
          isVerified: true,
          password: `${userData.email}_${appleId}`
        });

        const savedUser = await newUser.save();
        let access_token = await issueToken({
          _id: savedUser._id,
          email: savedUser.email,
        });
        console.log("user", savedUser)
        let result = {
          user: {
            _id: savedUser._id,
            email: savedUser.email,
            imageUrl: savedUser.image,
          }
        };
        return res.status(201).json({ message: "User created", user: newUser,token: access_token, success: true });
      }
    } catch (error) {
      console.log('Error', error);
      return res.status(500).send({ message: 'Error', error: error.message });
    }
  },
  userArtists: async (req, res) => {
    try {
      const userId = req.token._id
      // Fetch the preference document for the given user ID
      const preference = await preferences.findOne({ user_id: userId }).populate('artistsSelected').exec();

      if (!preference) {
        console.log('No preferences found for this user.');
        return res.status(400).json({ success: false, message: "No preference found" })
      }

      // Return the list of artists selected by the user
      return res.status(200).json({ success: true, data: preference })
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },
  downloadArtist: async (req, res) => {
    const { artist_id } = req.body;
    try {
      const user_id = req.token._id
      const downloadArtist = new DownloadArtist({ user_id, artist_id });
      await downloadArtist.save();
      return res.status(201).json({ message: "Artist downloaded successfully", message: true });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },
  getDownloadedArtists: async (req, res) => {
    try {
      const userId = req.token._id;
      const downloadArtists = await DownloadArtist.find({ user_id: userId })
        .populate('artist_id')  // assuming you want to populate details of artists
        .exec();

      return res.status(200).json({
        success: true,
        data: downloadArtists
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error: ' + error.message
      });
    }
  },
  getSingleDownloadArtist: async (req, res) => {
    const userId = req.token._id;
    const { artistId } = req.params;

    try {
      // Fetch the artist details
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(404).send({ message: 'Artist not found.' });
      }
      console.log("Artist:", artist);

      // Fetch albums associated with the artist
      const albums = await Album.find({ artist_id: artistId });
      console.log("Albums:", albums);

      // Fetch artist preferences for the user or use default
      const preference = await preferences.findOne({ user_id: userId, artistsSelected: artistId });
      console.log("Preference:", preference);

      const contentTypes = preference ? preference.artistContent : ['News', 'Event', 'Collectable items']; // Default to all if no preference
      console.log("Content Types:", contentTypes);

      const results = {};
      if (contentTypes.includes('News') || contentTypes.length === 0) {
        const news = await News.find({ artist_id: artistId });
        results.news = news;
      }

      if (contentTypes.includes('Event') || contentTypes.length === 0) {
        const event = await Event.find({ artist_id: artistId });
        results.events = event;
      }
      if (contentTypes.includes('Collectable items') || contentTypes.length === 0) {
        const shop = await Shop.find({ artist_id: artistId });
        results.shop = shop;
      }

      if (Object.keys(results).length === 0) {
        return res.status(404).send({ message: 'No content found for this artist according to user preferences or defaults.' });
      }

      // Combine artist details with albums and other content results
      const artistDetails = {
        ...artist.toObject(),
        albums: albums,  // Include the albums in the response
        news: results.news || [],
        events: results.events || [],
        shop: results.shop || []
      };

      return res.status(200).json({ artist: artistDetails, success: true, message: "Artist Details" });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },

  getAlbumsOfUserRedeemed: async (req, res) => {
    const userId = req.token._id;

    try {
      const redeemedAlbums = await UserAlbum.find({
        user_id: userId,
      }).populate('album_id');

      if (!redeemedAlbums || redeemedAlbums.length === 0) {
        return res.status(404).send({ message: 'No redeemed albums found for this user.', success: false });
      }

      return res.status(200).json({ albums: redeemedAlbums, success: true });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },
  getRedeemedAlbums: async (req, res) => {
    const { albumId } = req.params;
    const userId = req.token._id
    try {
      console.log("user", userId)
      // Check if the user has access to this album
      // Check if the user has access to this album
      const userAlbums = await UserAlbum.findOne({ user_id: userId });
      const album = await Album.findById(albumId)
        .populate('songs_id')
        .populate('label_id')
        .populate('photos_id')
        .populate({
          path: 'artist_id',  // Correctly accessing the array of artist IDs
          model: 'Artist',
          populate: {
            path: 'userId',   // The field in Artist schema that references Dashboarduser
            model: 'Dashboarduser'
          }    // Explicitly specifying the model might help if the ref is not being recognized
        })

      if (!album) {
        return res.status(404).send({ message: 'No album found with that ID', success: false });
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
      return res.status(200).json({ Album: enhancedAlbum, success: true });

    } catch (error) {
      console.error('Error fetching album:', error);
      return res.status(500).send({ message: 'Error fetching album', error: error.message });
    }
  },
  getAllArtists: async (req, res) => {
    try {
      const artists = await Artist.find({});
      return res.status(200).json({ artists: artists, success: true });
    } catch (error) {
      console.error('Error fetching album:', error);
      return res.status(500).send({ message: 'Error fetching album', error: error.message });
    }
  },
  getAllGenre: async (req, res) => {
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
  },
  addSongHistory: async (req, res) => {
    const userId = req.token._id
    const { songId, albumId } = req.body;  // songs is an array of {songId, albumId}
    try {
      if (!songId || !albumId) {
        console.log('Provide Song and Album');
        return res.status(400).json({ success: false, message: "Provide Song and Album" })
      }
      // Log the play event with the album and song ID
      const newPlay = new PlayHistory({
        user_id: userId,
        song_id: songId,
        album_id: albumId
      });
      await newPlay.save();
      return res.status(201).json({ message: "Song played", success: true });

    } catch (error) {
      console.error("Error retrieving genres:", error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  },
  getHistorySongs: async(req, res) => {
    const userId = req.token._id;
    try {
        // Fetch history for the given user ID
        const history = await PlayHistory.find({ user_id: userId })
            .populate({
                path: 'song_id',
            })
            .populate({
                path: 'album_id',
            });

        // Extract unique song IDs from history
        const songIds = history.map(item => item.song_id._id);

        // Fetch audio and video details for these songs
        const audios = await Audio.find({ song_id: { $in: songIds } });
        const videos = await Video.find({ song_id: { $in: songIds } });

        // Create maps to associate song IDs with their respective audio and video
        const audioMap = audios.reduce((map, audio) => {
            map[audio.song_id.toString()] = audio;
            return map;
        }, {});
        const videoMap = videos.reduce((map, video) => {
            map[video.song_id.toString()] = video;
            return map;
        }, {});

        // Enhance history records with audio and video details, streamline album and song information
        const enhancedHistory = history.map(item => ({
            _id: item._id,
            user_id: item.user_id,
            playedAt: item.playedAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            album: {
                _id: item.album_id._id,
                title: item.album_id.title,
                cover_image: item.album_id.cover_image
            },
            song: {
                audio: audioMap[item.song_id._id.toString()] ? {
                    ...audioMap[item.song_id._id.toString()]._doc
                } : {},
                video: videoMap[item.song_id._id.toString()] ? {
                    ...videoMap[item.song_id._id.toString()]._doc
                } : {}
            }
        }));

        // Log or respond with the enhanced history
        return res.status(200).json({
            success: true,
            songs: enhancedHistory
        });

    } catch (error) {
        console.error("Error retrieving enhanced history:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
            error: error
        });
    }
}
};
