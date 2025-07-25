const Users = require("../models/user");
const { generateErrorInstance, sendVerificationEmail, ResendVerificationEmail, sendResetPasswordMail, comparePassword, uploadFile, issueToken, sendWellcomeMail } = require("../utils");
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
const Social = require("../models/social")
const Audio = require("../models/audio")
const Video = require("../models/video")
const PlayHistory = require("../models/listeningHistory")
const Dashboarduser = require("../models/dashboardUsers")
const mongoose = require("mongoose")

module.exports = {
  addUser: async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ msg: "Please provide user data", success: false });
      }
      // Check if email exists in any collection
      const dashboardUserExists = await Dashboarduser.findOne({ email: email });
      const appUserExists = await Users.findOne({ email: email });

      if (dashboardUserExists) {
        return res.status(409).json({
          msg: "Looks like this email is already linked to a another role. Try sign up using another email.",
          success: false,
        });
      }
      if (appUserExists) {
        return res.status(409).json({
          msg: "Email already in use",
          success: false,
        });
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
      if (!user) {
        return res.status(404).json({ msg: "User not found", success: false });
      }
      if (user.otp !== otp) {
        return res.status(401).json({ msg: "Invalid OTP", success: false });
      }
      user.isVerified = true;
      user.otp = "";
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
      let files = req.files.file;
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
  updateProfile: async (req, res) => {
    try {
      const userId = req.token._id;
      const { firstName, lastName, profile_img } = req.body;

      if (!firstName && !lastName && !profile_img) {
        return res.status(400).json({
          success: false,
          msg: "Please provide firstName, lastName, or profile_img to update."
        });
      }

      // Build the `$set` update object
      const updateFields = { updatedAt: Date.now() };
      if (firstName != null) updateFields.firstName = firstName;
      if (lastName != null) updateFields.lastName = lastName;
      if (profile_img != null) updateFields.profile_img = profile_img;

      const updatedUser = await Users.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select("-password -otp");

      if (!updatedUser) {
        return res.status(404).json({ success: false, msg: "User not found." });
      }

      return res.status(200).json({
        success: true,
        msg: "Profile updated successfully.",
        user: updatedUser
      });

    } catch (error) {
      console.error("updateProfile error:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to update profile.",
        error: error.message
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
          zipCode: zipcode,
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

      await sendWellcomeMail(user.email);
      return res.status(200).json({
        success: true,
        message: 'Preference created successfully',
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

        return res.status(200).send({ msg: "Login successful", user: findUser, access_token, success: true })
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
        // Check if email exists in any collection
        const dashboardUserExists = await Dashboarduser.findOne({ email: user.email });
        const appUserExists = await Users.findOne({ email: user.email });
        if (dashboardUserExists || appUserExists) {
          return res.status(409).json({
            msg: "Email already in use",
            success: false,
          });
        }

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
        return res.status(201).json({ msg: "Login successful", user: savedUser, access_token, success: true });
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
        return res.status(200).send({ msg: "Login successful", user: user, access_token, success: true })

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
        // Check if email exists in any collection
        const dashboardUserExists = await Dashboarduser.findOne({ email: userData.email });
        const appUserExists = await Users.findOne({ email: userData.email });
        if (dashboardUserExists || appUserExists) {
          return res.status(409).json({
            msg: "Email already in use",
            success: false,
          });
        }
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
        return res.status(201).json({ msg: "Login successful", user: newUser, access_token, success: true });
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
      return res.status(200).json({ message: "Artist downloaded successfully", message: true });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },
  getDownloadedArtists: async (req, res) => {
    try {
      const userId = req.token._id;
      const downloadArtists = await DownloadArtist.find({ user_id: userId })
        .populate('artist_id')
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
  removeDownloadedArtist: async (req, res) => {
    try {
      const userId = req.token._id;
      const { artistId } = req.body;

      // Check if the user has downloaded the artist
      const downloadArtist = await DownloadArtist.findOne({ user_id: userId, artist_id: artistId });
      if (!downloadArtist) {
        return res.status(400).json({ success: false, message: "Artist not found in downloads" });
      }

      // Remove the downloaded artist
      await DownloadArtist.deleteOne({ _id: downloadArtist._id });

      return res.status(200).json({ success: true, message: "Artist removed from downloads" });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },



  getSingleDownloadArtist: async (req, res) => {
    const userId = req.token._id;
    const { artistId } = req.params;
    console.log("id", artistId)
    try {
      // Fetch the artist details
      const artist = await Artist.findById(artistId);
      console.log("artist", artist)
      if (!artist) {
        return res.status(404).send({ message: 'Artist not found.' });
      }
      console.log("Artist:", artist);

      // Fetch albums associated with the artist
      const albums = await Album.find({ artist_id: artistId }).populate('artist_id', 'name');;
      console.log("Albums:", albums);
      // Transform the album data to adjust the artist_id field and remove the original array
      const transformedAlbums = albums.map(album => {
        // Assuming artist_id is always an array with one item for simplicity in this use case
        const artist = album.artist_id[0] ? {
          _id: album.artist_id[0]._id,
          name: album.artist_id[0].name
        } : '';

        // Use object destructuring and rest to omit the artist_id field and add artistName
        const { artist_id, ...rest } = album._doc;
        return {
          ...rest,
          artistName: artist.name // Include artistName object instead of the array
        };
      });

      // Attempt to fetch artist preferences for the user
      // const preference = await preferences.findOne({ user_id: userId, artistsSelected: artistId });
      // console.log("Preference:", preference);

      // let contentTypes = preference ? preference.artistContent : ['News', 'Concerts', 'Collectable items'];
      // console.log("Preferred Content Types:", contentTypes);

      // const results = {};
      // let contentAvailable = false;

      // Check each content type for data
      // if (contentTypes.includes('News')) {
      //   const news = await News.find({ artist_id: artistId });
      //   if (news.length > 0) {
      //     results.news = news;
      //     contentAvailable = true;
      //   }
      // }

      // if (contentTypes.includes('Concerts')) {
      //   const events = await Event.find({ artist_id: artistId });
      //   if (events.length > 0) {
      //     results.events = events;
      //     contentAvailable = true;
      //   }
      // }

      // if (contentTypes.includes('Collectable items')) {
      //   const collectables = await Shop.find({ artist_id: artistId });
      //   if (collectables.length > 0) {
      //     results.shop = collectables;
      //     contentAvailable = true;
      //   }
      // }

      // If no content available for preferred types, default to all
      // if (!contentAvailable) {
      //   results.news = await News.find({ artist_id: artistId });
      //   results.events = await Event.find({ artist_id: artistId });
      //   results.shop = await Shop.find({ artist_id: artistId });
      // }

      // Check if still no content found
      // if (Object.keys(results).every(key => results[key].length === 0)) {
      //    // Combine artist details with albums and other content results
      // const artistDetails = {
      //   ...artist.toObject(),
      //   albums: transformedAlbums,  // Include the albums in the response
      //   news: results.news || [],
      //   events: results.events || [],
      //   shop: results.shop || []
      // };
      //   return res.status(200).send({ message: 'Artist Details missing',success:true, artist: artistDetails });
      // }

      // Combine artist details with albums and other content results
      const artistDetails = {
        ...artist.toObject(),
        albums: transformedAlbums,  // Include the albums in the response
        // news: results.news || [],
        // events: results.events || [],
        // shop: results.shop || []
      };

      return res.status(200).json({ artist: artistDetails, success: true, message: "Artist Details" });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },
  getSocials: async (req, res) => {
    try {
      const { artistId } = req.params
      const socials = await Social.find({ artist_id: artistId })
      return res.status(200).json({ socials: socials, success: true })
    } catch (error) {
      console.log("error", error)
      return res.status(500).json({ message: error.message });
    }
  },
  getNewsEvents: async (req, res) => {
    try {
      const { artistId } = req.params
      const news = await News.find({ artist_id: artistId })
      const event = await Event.find({ artist_id: artistId })
      return res.status(200).json({ success: true, News: news, Event: event })
    } catch (error) {
      console.log("error", error)
      return res.status(500).json({ message: error.message });
    }
  },
  getFeatureAlbums: async (req, res) => {
    try {
      const { artistId } = req.params;
      const albums = await Album.find({ artist_id: artistId, isFeatured: true })
        .populate('artist_id', 'name'); // Include the artist's name

      // Transform the album data to adjust the artist_id field and remove the original array
      const transformedAlbums = albums.map(album => {
        // Assuming artist_id is always an array with one item for simplicity in this use case
        const artist = album.artist_id[0] ? {
          _id: album.artist_id[0]._id,
          name: album.artist_id[0].name
        } : '';

        // Use object destructuring and rest to omit the artist_id field and add artistName
        const { artist_id, ...rest } = album._doc;
        return {
          ...rest,
          artistName: artist.name // Include artistName object instead of the array
        };
      });

      res.status(200).json({ success: true, album: transformedAlbums });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  getArtistShop: async (req, res) => {
    try {
      const { artistId } = req.params
      const shop = await Shop.find({ artist_id: artistId });
      return res.status(200).json({ success: true, shop: shop })
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  },
  getArtistPhotos: async (req, res) => {
    try {
      const { artistId } = req.params;
      // Find the albums and populate the photos_id field
      const albums = await Album.find({ artist_id: artistId })
        .select('photos_id -_id')
        .populate('photos_id');

      // Use an object to temporarily store data to prevent duplicates
      const photoMap = {};
      albums.forEach(album => {
        album.photos_id.forEach(photo => {
          // Store each photo by its ID in an object to ensure uniqueness
          photoMap[photo._id.toString()] = {
            id: photo._id.toString(),
            url: photo.img_url, // Assume each photo document has an 'img_url' field
            title: photo.title, // Assume there is a 'title' field
            type: photo.type
            // Add other fields as needed
          };
        });
      });

      // Convert the map to an array of photo objects
      const uniquePhotosAndVideos = Object.values(photoMap);

      // Wrap the array in a 'photosAndVideos' object
      const response = {
        success: true,
        photosAndVideos: uniquePhotosAndVideos
      };

      res.status(200).json(response); // Send the wrapped array of unique photos and videos
    } catch (error) {
      res.status(500).json({ message: error.message });
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
    const userId = req.token._id;

    try {
      console.log("user", userId);
      const userAlbums = await UserAlbum.findOne({
        user_id: userId,
        album_id: albumId  // Assuming albumId is already an ObjectId or both are strings
      });
      if (!userAlbums) {
        return res.status(200).json({ success: true, album: {}, message: "This user hasn't redeemed this album", redeemed: false })
      }
      const album = await Album.findById(albumId)
        .populate('songs_id')
        .populate('label_id')
        .populate('photos_id')
        .populate({
          path: 'artist_id',
          model: 'Artist',
          populate: {
            path: 'userId',
            model: 'Dashboarduser'
          }
        });

      if (!album) {
        return res.status(404).send({ message: 'No album found with that ID', success: false });
      }

      console.log(album);

      const songIds = album.songs_id.map(song => song._id);
      const audios = await Audio.find({ song_id: { $in: songIds } });
      const videos = await Video.find({ song_id: { $in: songIds } });

      const audioMap = audios.reduce((map, audio) => {
        map[audio.song_id.toString()] = audio;
        return map;
      }, {});

      const videoMap = videos.reduce((map, video) => {
        map[video.song_id.toString()] = video;
        return map;
      }, {});
      console.log("useral", userAlbums)
      const isRedeemed = userAlbums && userAlbums.album_id;

      const enhancedSongs = album.songs_id.map(song => {
        const likedByCurrentUser = song.likedBy.includes(userId);
        const songData = {
          ...song._doc,
          liked: isRedeemed && likedByCurrentUser || false, // Set liked flag based on redemption status
        };
        delete songData.likedBy;  // Remove the likedBy array from the response
        if (isRedeemed) {
          songData.audio = audioMap[song._id.toString()];
          songData.video = videoMap[song._id.toString()];
        }

        return songData;
      });
      let redeemed = false
      console.log("redeemed", isRedeemed);
      if (isRedeemed.includes(userAlbums.album_id)) {
        redeemed = true
      }
      console.log("album", album)
      const enhancedAlbum = {
        artistName: album.artist_id[0].name,
        user_id: userId,
        ...album._doc,
        songs_id: enhancedSongs,
      };

      return res.status(200).json({ Album: enhancedAlbum, success: true, redeemed: true });

    } catch (error) {
      console.error('Error fetching album:', error);
      return res.status(500).send({ message: 'Error fetching album', error: error.message });
    }
  },
  getRedeemedAlbumVideos: async (req, res) => {
    const { albumId } = req.params;
    const userId = req.token._id;

    try {
      const userAlbums = await UserAlbum.findOne({ user_id: userId, album_id: albumId });

      if (!userAlbums) {
        return res.status(200).json({ success: true, videos: [], message: "This user hasn't redeemed this album", redeemed: false });
      }

      const album = await Album.findById(albumId)
        .populate({
          path: 'songs_id'
        });

      if (!album) {
        return res.status(404).send({ message: 'No album found with that ID', success: false });
      }

      const songIds = album.songs_id.filter(song => song.song_type === "video").map(song => song._id); // Extract song IDs only for video type songs

      const videos = await Video.find({ song_id: { $in: songIds } });

      const videoMap = videos.reduce((map, video) => {
        map[video.song_id.toString()] = video;
        return map;
      }, {});

      const enhancedSongs = album.songs_id
        .filter(song => song.song_type === "video" && videoMap[song._id.toString()]) // Filter songs to include only those with video data
        .map(song => {
          const isLiked = song.likedBy && song.likedBy.includes(userId); // Check if the current user has liked the song
          return {
            _id: song._id,
            label_id: song.label_id,
            genre_id: song.genre_id,
            song_type: song.song_type,
            createdAt: song.createdAt,
            updatedAt: song.updatedAt,
            __v: song.__v,
            isDeleted: song.isDeleted,
            isLiked: isLiked,  // Add the isLiked flag
            video: videoMap[song._id.toString()] ? { ...videoMap[song._id.toString()]._doc } : null // Attach video data if available
          };
        });

      return res.status(200).json({ success: true, videos: enhancedSongs, redeemed: true });
    } catch (error) {
      console.error('Error fetching album videos:', error);
      return res.status(500).send({ message: 'Error fetching album videos', error: error.message });
    }
  },
  getRedeemedAlbumAudios: async (req, res) => {
    const { albumId } = req.params;
    const userId = req.token._id;

    try {
      const userAlbums = await UserAlbum.findOne({ user_id: userId, album_id: albumId });

      if (!userAlbums) {
        return res.status(200).json({ success: true, audios: [], message: "This user hasn't redeemed this album", redeemed: false });
      }

      const album = await Album.findById(albumId)
        .populate({
          path: 'songs_id'
        });

      if (!album) {
        return res.status(404).send({ message: 'No album found with that ID', success: false });
      }

      const songIds = album.songs_id.filter(song => song.song_type === "audio").map(song => song._id); // Extract song IDs only for audio type songs

      const audios = await Audio.find({ song_id: { $in: songIds } });

      const audioMap = audios.reduce((map, audio) => {
        map[audio.song_id.toString()] = audio;
        return map;
      }, {});

      const enhancedSongs = album.songs_id
        .filter(song => song.song_type === "audio" && audioMap[song._id.toString()]) // Filter songs to include only those with audio data
        .map(song => {
          const isLiked = song.likedBy && song.likedBy.includes(userId); // Check if the current user has liked the song
          return {
            _id: song._id,
            label_id: song.label_id,
            genre_id: song.genre_id,
            song_type: song.song_type,
            createdAt: song.createdAt,
            updatedAt: song.updatedAt,
            __v: song.__v,
            isDeleted: song.isDeleted,
            isLiked: isLiked,  // Add the isLiked flag
            audio: audioMap[song._id.toString()] ? { ...audioMap[song._id.toString()]._doc } : null // Attach audio data if available
          };
        });

      return res.status(200).json({ success: true, audios: enhancedSongs, redeemed: true });
    } catch (error) {
      console.error('Error fetching album audios:', error);
      return res.status(500).send({ message: 'Error fetching album audios', error: error.message });
    }
  },
  getAllArtists: async (req, res) => {
    try {
      const artists = await Artist.find({}).sort({ createdAt: -1 });
      return res.status(200).json({ artists: artists, success: true });
    } catch (error) {
      console.error('Error fetching album:', error);
      return res.status(500).send({ message: 'Error fetching album', error: error.message });
    }
  },
  getAllArtistsDownload: async (req, res) => {
    try {
      const userId = req.token._id;

      const downloadedArtists = await DownloadArtist.find({ user_id: userId }).populate('artist_id');

      const downloadedArtistIds = downloadedArtists
        .map(download => download.artist_id?._id)
        .filter(id => id)
        .map(id => new mongoose.Types.ObjectId(id));

      console.log('Downloaded Artist IDs:', downloadedArtistIds);

      const artists = await Artist.find({
        _id: { $nin: downloadedArtistIds }
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: 'Artists not yet downloaded fetched successfully',
        data: artists,
      });
    } catch (error) {
      console.error('Error fetching undownloaded artists:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching artists',
        error: error.message,
      });
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
      return res.status(200).json({ message: "Song played", success: true });

    } catch (error) {
      console.error("Error retrieving genres:", error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  },

  getHistorySongs: async (req, res) => {
    const userId = req.token._id;

    try {
      const history = await PlayHistory.find({ user_id: userId })
        .populate('song_id')
        .populate('album_id');

      if (!history.length) {
        return res.status(404).json({
          success: false,
          songs: {
            "_id": "",
            "label_id": "",
            "genre_id": "",
            "song_type": "",
            "likedBy": [],
            "createdAt": "",
            "updatedAt": "",
            "__v": "",
            "album": {
              "_id": "",
              "artist_id": [
                ""
              ],
              "label_id": [
                ""
              ],
              "songs_id": [
                ""
              ],
              "photos_id": [
                ""
              ],
              "title": "",
              "isFeatured": "",
              "release_date": "",
              "description": "",
              "cover_image": "",
              "createdAt": "",
              "updatedAt": "",
              "__v": ""
            },
            "audio": {
              "_id": "",
              "song_id": "",
              "title": "",
              "audio_quality": "",
              "lyricsFile": "",
              "file_path": "",
              "bit_rate": "",
              "file_size": {
                "$numberDecimal": ""
              },
              "duration": "",
              "createdAt": "",
              "updatedAt": "",
              "__v": ""
            },
            "video": {
              "_id": "",
              "song_id": "",
              "lyricsFile": "",
              "title": "",
              "duration": "",
              "file_path": "",
              "thumbnail": "",
              "resolution": "",
              "video_format": "",
              "createdAt": "",
              "updatedAt": "",
              "__v": ""
            }
          },
        });
      }

      // Filter out history items without valid song IDs and extract unique song IDs
      const songIds = history.filter(item => item.song_id && item.song_id._id)
        .map(item => item.song_id._id);

      // Initialize audioMap and videoMap to empty objects
      let audioMap = {}, videoMap = {};

      // Proceed only if there are valid song IDs
      if (songIds.length > 0) {
        const audios = await Audio.find({ song_id: { $in: songIds } });
        const videos = await Video.find({ song_id: { $in: songIds } });

        audioMap = audios.reduce((map, audio) => {
          map[audio.song_id.toString()] = audio;
          return map;
        }, {});

        videoMap = videos.reduce((map, video) => {
          map[video.song_id.toString()] = video;
          return map;
        }, {});
      }

      // Prepare songs with their audio and video details, only for valid song_ids
      let allSongs = history.map(item => {
        if (item.song_id) {
          return {
            ...item.song_id._doc,
            album: item.album_id,
            audio: audioMap[item.song_id._id.toString()],
            video: videoMap[item.song_id._id.toString()]
          };
        } else {
          // Handle the case where song_id is null
          return {
            album: item.album_id,
            audio: null,
            video: null
          };
        }
      });

      return res.status(200).json({ songs: allSongs, success: true });
    } catch (error) {
      console.error("Error retrieving enhanced history:", error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.toString()
      });
    }
  },

  listeningCount: async (req, res) => {
    try {
      const artistId = req.params.artistId;
      // Define the start of the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Define the end of the current month
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Find all albums by the artist
      const albums = await Album.find({ artist_id: artistId });

      if (albums.length === 0) {
        // Return default response with no songs and count 0
        return res.status(200).json({
          playCounts: [{ totalUniqueUsers: 0, songs: [] }],
          currentMonthListenerCount: 0,
          success: true
        });
      }

      // Extract album IDs
      const albumIds = albums.map(album => album._id);

      // Aggregate song histories to count distinct users per song and for the current month
      const aggregateQuery = [
        {
          $match: {
            album_id: { $in: albumIds },
            playedAt: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: "$song_id",
            uniqueUsers: { $addToSet: "$user_id" }
          }
        },
        {
          $group: {
            _id: null,
            totalUniqueUsers: { $addToSet: "$uniqueUsers" }, // Collect arrays of unique users
            songs: { $push: { song_id: "$_id" } } // Collect song details
          }
        },
        {
          $project: {
            _id: 0,
            totalUniqueUsers: { $size: { $reduce: { input: "$totalUniqueUsers", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } } },
            songs: 1
          }
        }
      ];

      const results = await PlayHistory.aggregate(aggregateQuery);

      if (results.length === 0) {
        // If no results are found, return default response
        return res.status(200).json({ playCounts: [{ totalUniqueUsers: 0, songs: [] }], currentMonthListenerCount: 0, success: true });
      }

      const { totalUniqueUsers, songs } = results[0];
      return res.status(200).json({
        playCounts: [{ totalUniqueUsers, songs }],
        currentMonthListenerCount: totalUniqueUsers,
        success: true
      });
    } catch (error) {
      console.error("Failed to retrieve song play counts:", error);
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
  artistSongs: async (req, res) => {
    const userId = req.token._id;
    try {
      const { artistId } = req.body;
      // Fetch user albums
      const userAlbums = await UserAlbum.findOne({ user_id: userId });
      if (!userAlbums || userAlbums.album_id.length === 0) {
        return res.status(404).json({
          success: true,
          message: "No albums found for user.",
          songs: [{
            likedBy: [],
            _id: null,
            label_id: null,
            genre_id: null,
            song_type: null,
            createdAt: null,
            updatedAt: null,
            __v: 0,
            audio: null,
            video: null
          }]
        });
      }

      // Fetch albums, optionally filtered by artist ID
      let query = { _id: { $in: userAlbums.album_id } };
      if (artistId) {
        query['artist_id'] = artistId;
      }
      console.log("query", query);
      const albums = await Album.find(query)
        .populate({
          path: 'songs_id',
          populate: [{ path: 'genre_id' }]
        });

      if (albums.length === 0) {
        return res.status(404).json({
          message: "No albums found.",
          success: true,
          songs: [{
            likedBy: [],
            _id: null,
            label_id: null,
            genre_id: null,
            song_type: null,
            createdAt: null,
            updatedAt: null,
            __v: 0,
            audio: null,
            video: null
          }]
        });
      }

      // Extract song IDs from albums
      const songIds = albums.flatMap(album => album.songs_id.map(song => song._id));

      // Fetch audio and video details for songs
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

      // Prepare songs with their audio and video details
      let allSongs = [];
      albums.forEach(album => {
        album.songs_id.forEach(song => {
          allSongs.push({
            ...song._doc,
            audio: audioMap[song._id.toString()],
            video: videoMap[song._id.toString()]
          });
        });
      });

      return res.status(200).json({ songs: allSongs, success: true });
    } catch (error) {
      console.error('Error fetching user media:', error);
      return res.status(500).send({ message: 'Error fetching media', error: error.message });
    }
  },
  getSongNames: async (req, res) => {
    const { id } = req.params;

    try {
      const albums = await Album.findById(id)
        .populate({
          path: 'songs_id',
          populate: [{ path: 'genre_id' }]
        });


      if (!albums) {
        return res.status(404).json({ success: false, message: 'Album not found', songNames: [""] });
      }

      if (!albums.songs_id.length) {
        return res.status(200).json({ success: true, message: "Album has no songs", songNames: [""] });
      }
      const songIds = albums.songs_id.map(song => song._id);
      console.log("ids", songIds)
      // Fetch audio and video details for songs
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

      // Prepare songs with their audio and video details
      let allSongs = [];
      albums.songs_id.forEach(song => {
        allSongs.push({
          ...song._doc,
          audio: audioMap[song._id.toString()],
          video: videoMap[song._id.toString()]
        });
      });

      // Extract song names for response
      const songNames = allSongs.map(song => song.audio ? song.audio.title : song.video ? song.video.title : "Untitled Song");


      return res.status(200).json({ success: true, songNames: songNames });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
};
