const Admin = require("../models/dashboardUsers")
const Song = require("../models/song")
const Audio = require("../models/audio")
const Video = require("../models/video")
const User = require("../models/user")
const Role = require('../models/role'); 
const Artist = require("../models/artist")
const Event = require("../models/event")
const News = require("../models/news")
const Photo = require("../models/photo")
const Album = require("../models/album")
let bcrypt = require("bcrypt");
const crypto = require('crypto');
let utils = require("../utils/index");
const { sendResetPasswordMail,sendUserInvite} = require("../utils");
const Action = require("../models/actions")
let methods = {
  addAdmin: async (req, res) => {
    try {
        let { email, password, role: roleId,name,bio,image,firstName,lastName } = req.body;
      const label_id= req.token._id
      console.log("labellll",label_id)
        if (!email || !password || !roleId) {
            return res.status(400).json({
                msg: "Please provide email, password, and role",
                success: false,
            });
        }

        let userData = await Admin.findOne({ email: email });
        if (userData) {
            return res.status(404).json({
                msg: "Admin already exists",
                success: false,
            });
        }

        // Fetch the role document using the role ID
        let role = await Role.findById(roleId);
        if (!role) {
            return res.status(404).json({
                msg: "Role not found",
                success: false,
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Access the role of the user making the request
        const loggedInUserRole = req.token.role;

        // Verify that the logged-in user can create or assign the requested role
        if ((["SUPER_ADMIN", "SUPER_ADMIN_STAFF", "LABEL"].includes(role.role)) && loggedInUserRole !== "SUPER_ADMIN") {
            return res.status(403).json({
                msg: "You do not have permission to assign SUPER_ADMIN roles",
                success: false,
            });
        } else if ((["LABEL_STAFF", "ARTIST"].includes(role.role)) && loggedInUserRole !== "LABEL") {
            return res.status(403).json({
                msg: "You do not have permission to assign LABEL roles",
                success: false,
            });
        }

        let admin = new Admin({ email, password: hashedPassword, user_role: roleId ,firstName:firstName,lastName:lastName,createdBy:req.token._id});

        let addUser = await admin.save();
        if (!addUser) {
            return res.status(500).json({
                msg: "Failed to add admin",
                success: false,
            });
        }
        console.log("role",role)
        if(role.role === "ARTIST"){
          let artist = new Artist({ name, bio, profile_picture:image,userId: addUser._id,label_id:label_id});
          let artistAdd = await artist.save();
        }
        // Assuming sendUserInvite is a function you have for sending invitations
        await sendUserInvite(email, password, role.role); 
        return res.status(200).json({
            user: addUser,
            success: true,
        });
    } catch (error) {
        console.log("error", error);
        return res.status(500).json({
            msg: "Failed to add user",
            error: error.message || "Something went wrong.",
            success: false,
        });
    }
},

adminLogin: async(req, res) => {
  try {
      const { email, password } = req.body;
      if (!email || !password) {
          return res.status(401).json({
              msg: "Please enter right Credentials!",
              success: false,
          });
      }
      let admin = await Admin.findOne({ email }).populate({
          path: 'user_role',
          populate: {
              path: 'Permissions'
          }
      });
      if (!admin) {
          return res.status(404).json({
              msg: "User with this email does not exist",
              success: false,
          });
      }

      let match = await utils.comparePassword(password, admin.password);
      if (!match) {
          return res.status(401).json({
              msg: "Wrong Password Entered",
              success: false,
          });
      }
      console.log("admin",admin)
      let permissions = admin.user_role.Permissions.map(permission => {
          return {resource: permission.resource, action: permission.action};
      });
      let artist = await Artist.findOne({ userId:admin._id })
      console.log("artisy",artist)
      let access_token = await utils.issueToken({
          _id: admin._id,
          email: admin.email,
          role: admin.user_role.role,
          permissions: permissions,
          artist: artist?._id || null
      });

      let result = {
          user: {
              _id: admin._id,
              email: admin.email,
              role: admin.user_role.role,
              permissions: permissions,
              artist: artist?._id || null
          },
          access_token,
      };

      return res.status(200).json({ success: true, result });
  } catch (error) {
      console.log("error", error)
      return res.status(500).json({
          msg: "Login Failed",
          error: error,
          success: false,
      });
  }
},

    forgetPassword: async(req,res)=>{
        try {
            let email = req.body.email;
            let findUser = await Admin.findOne({ email: email });
            if (!findUser) {
              return res.status(404).json({
                msg: "Admin with this Email does not exist",
                success: false,
              });
            }
             // Generate a new OTP
             const newOtp = crypto.randomInt(1000, 9999) // Generate a 6-digit OTP
            let updateUser = await Admin.findOneAndUpdate(
              { email: email },
              { $set: { otp: newOtp } },
              { new: true }
            );
            sendResetPasswordMail(findUser.email, newOtp);
           return res.status(200).json({
              msg: "Reset Email Have been sent",
              success: true,
            });
          } catch (error) {
           return res.status(500).json({
              msg: error.message,
              success: false,
            });
          }
    },
    adminVerify: async(req,res)=>{
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({
                    msg: "Please provide both email and OTP",
                    success: false,
                });
            }
    
            // Find the user by email
            let admin = await Admin.findOne({ email: email });
            if (!admin) {
                return res.status(400).json({
                    msg: "Admin not found",
                    success: false,
                });
            }
    
            // Check if the OTP matches
            if (admin.otp !== otp) {
                return res.status(401).json({
                    msg: "Invalid OTP",
                    success: false,
                });
            }
    
            // Verify the user and update isVerified to true
            admin.isVerified = true;
            admin.otp = null; // Clear the OTP field after successful verification
            await admin.save();
    
           return res.status(200).json({
                msg: "admin verified successfully",
                success: true,
            });
        } catch (error) {
           return res.status(500).json({
                msg: "Failed to verify user",
                error: error.message || "Something went wrong.",
                success: false,
            });
        }
    },
    resetPassword: async(req,res)=>{
        try {
            let email = req.body.email;
            let password = req.body.password;
            if (!email || !password) {
                return res.status(401).json({
                  msg: "Please enter right Credentials!",
                  success: false,
                });
              }
            let findUser = await Admin.findOne({ email: email });
            if (!findUser) {
              return res.status(200).json({
                msg: "Admin not found",
                success: true,
              });
            }
            let match = await utils.comparePassword(password, findUser.password);
            if (match) {
              return res.status(400).json({
                msg: "Old password cannot be set as new password",
                success: false,
              });
            }
            let newPassword = await bcrypt.hash(password, 10);
            let user = await Admin.findByIdAndUpdate(
              { _id: findUser._id },
              { $set: { password: newPassword, otp: "" } },
              { new: true }
            );
            return res.status(200).json({
              msg: "Admin Password Have been Reset",
              success: true,
            });
          } catch (error) {
            return res.status(500).json({
              msg: error.message,
              success: false,
            });
          }
    },
    deleteAdmin:async(req,res)=>{
      try {
        const { id } = req.params;
        const admin = await Admin.findByIdAndDelete(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
       return res.status(200).json({
            success: true,
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        console.error("Error deleting admin:", error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
    },
    updateAdmin: async(req,res)=>{
      const  adminId = req.token._id;
      const { firstname, lastname, profilepic } = req.body;
  
      try {
          const admin = await Admin.findById(adminId);
          if (!admin) {
              return res.status(404).send('Admin not found');
          }
  
          // Update fields
          if (firstname) admin.firstName = firstname;
          if (lastname) admin.lastName = lastname;
          if (profilepic) admin.profilepic = profilepic;
  
          await admin.save(); // Save the updated document
  
        return  res.send({
              message: 'Admin updated successfully',
              data: admin
          });
      } catch (error) {
        console.log("error",error)
         return res.status(500).send({
              message: 'Error updating admin',
              error: error.message
          });
      }
    },
    labelCreation: async(req,res)=>{
        try {
            const {email , password , role} = req.body
            if(!email || !password ||!role){
                return res.status(400).json({
                    msg: "Please provide Label data",
                    success: false,
                  });
            }
            let admin = await Admin.findOne({ email });
            if (admin) {
              return res.status(404).json({
                msg: "User with this email exist",
                success: false,
              });
            }
            const hashedPassword = await bcrypt.hash(password, 10);

             admin = new Admin({ email, password: hashedPassword, user_role:role });
            let addUser = await admin.save();
            sendLabelInvite(email,password)
            if (!addUser) {
              return res.status(500).json({
                msg: "Failed to add admin",
                success: false,
              });
            }
        
          return  res.status(200).json({
              user: addUser,
              success: true,
            });
        } catch (error) {
            
        }
    },
    createActions: async(req,res)=>{
      try {
          const actions = req.body.actions; // Expect actions to be an array of action objects
          if (!actions || !Array.isArray(actions)) {
              return res.status(400).json({ message: 'Invalid input: Expected an array of actions' });
          }
  
          const insertedActions = await Action.insertMany(actions);
         return res.status(201).json(insertedActions);
      } catch (error) {
          console.error("Error creating preference:", error);
          return res.status(500).json({
              success: false,
              message: error.message || 'Internal server error'
          });
      }
  },
  getActions: async(req,res)=>{
    try {
      const actions = await Action.find().sort({ resource: 1, action: 1 });
     return res.json(actions);
  } catch (error) {
      console.error('Error fetching actions:', error);
     return res.status(500).json({ message: 'Error fetching actions', error });
  }
  },
  updateUser: async(req,res)=>{
    try {
      const { userId } = req.params;

      const { permissions, ...userDetails } = req.body; // Destructure permissions and other user details from body

      // Fetch the user by ID
      const user = await Admin.findById(userId);
      if (!user) {
          return res.status(404).json({ message: "User not found." });
      }

      // Dynamically update user fields if they exist in the request body
      Object.keys(userDetails).forEach(key => {
          if (userDetails[key] !== undefined) { // Check to ensure undefined fields are not set on the user object
              user[key] = userDetails[key];
          }
      });

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
          const newPermissionsSet = new Set([...user.permissions.map(String), ...permissions]);
          user.permissions = Array.from(newPermissionsSet);
      }

      await user.save();
      res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user', error });
  }
  },
  getAllUsers: async(req,res)=>{
    try {
      const users = await Admin.find({ _id: { $ne: req.token._id } }).populate("user_role");
     return res.send(users);
  } catch (error) {
     return res.status(500).send(error);
  }
  },
  getAllLabels: async(req,res)=>{
    try {
      const labelUsers = await Admin.find({ user_role: 'LABEL' });
     return res.status(200).send(labelUsers);
  } catch (error) {
     return res.status(500).send(error);
  }
  },
  getAllSongsOfLabel: async (req, res) => {
    try {
        const userId = req.params.id;
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
changePassword: async (req, res) => {
  try {
    let _id = req.token._id;
    let data = req.body;
    let password = data.password;
    let user = await Admin.findOne({ _id });
    if (!user) {
      return res.status(404).json({
        msg: "User not found with this id",
        success: false,
      });
    }
    let userId = user._id;
    console.log("user",user)
    let match = await utils.comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({
        msg: "The password you entered does not match your real password! Input Correct Password",
        success: false,
      });
    }
    data.password = await bcrypt.hash(data.newPassword, 10);
    let samePassword = await utils.comparePassword(
      data.newPassword,
      user.password
    );
    if (samePassword) {
      return res.status(400).json({
        msg: "Old and new password cannot be same",
        success: false,
      });
    }
    let updatePassword = await Admin.findOneAndUpdate(
      { _id: userId },
      {
        password: data.password,
      }
    );
    return res.status(200).json({
      msg: "Password Updated",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Failed to Change Password",
      error: error.message,
      success: false,
    });
  }
},
getCustomers:async(req,res)=>{
  try {
    const user = await User.find();
    if (!user) {
        return res.status(404).send('User not found.');
    }
   return res.status(200).send(user);
} catch (error) {
   return res.status(500).send(error);
}
},
updateCustomers: async (req, res) => {
  const { firstName, lastName, dob, gender, zipCode } = req.body;

  try {
      const updatedUser = await User.findByIdAndUpdate(
          req.params.id,
          { firstName, lastName, dob, gender, zipCode }, // Updated fields in an object
          { new: true }  // Option to return the updated document
      );

      if (!updatedUser) {
          return res.status(404).send('User not found.');
      }

      res.status(200).send(updatedUser);
  } catch (error) {
      res.status(500).send(error);
  }
},
deleteCustomer: async(req,res)=>{
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
        return res.status(404).send('User not found.');
    }
   return res.status(200).send("Custoner Deleted Successfully");
} catch (error) {
   return res.status(500).send(error);
}
},
getCount:async(req,res)=>{
  try {
    const roles = ['SUPER_ADMIN', 'SUPER_ADMIN_STAFF', 'LABEL', 'LABEL_STAFF'];
    const userRole = req.token.role.toString().toUpperCase();
    let labelId
    if (['LABEL', 'LABEL_STAFF'].includes(userRole)) {
      if (userRole === 'LABEL') {
          // Directly use the user's ID if the role is LABEL
          labelId = req.token._id;
      } else if (userRole === 'LABEL_STAFF') {
          // Find the label ID from the createdBy if the role is LABEL_STAFF
          const labelUser = await Dashboarduser.findById(req.token.createdBy);
          labelId = labelUser ? labelUser.createdBy : null;  // Ensure that createdBy points to the LABEL's ID
      }
  }
  if(['SUPER_ADMIN', 'SUPER_ADMIN_STAFF',].includes(userRole)){
     // Count for each model
     const countAlbums = await Album.countDocuments();
     const countArtists = await Artist.countDocuments();
     const countPhotos = await Photo.countDocuments();
     const countEvents = await Event.countDocuments();
     const countNews = await News.countDocuments();
 
     // Specific counts for audio and video songs
     const countAudioSongs = await Song.countDocuments({ song_type: 'audio' });
     const countVideoSongs = await Song.countDocuments({ song_type: 'video' });
 
     // Sending response with counts
     res.json({
         albums: countAlbums,
         artists: countArtists,
         songs: {
             audio: countAudioSongs,
             video: countVideoSongs,
             total: countAudioSongs + countVideoSongs
         },
         photos: countPhotos,
         events: countEvents,
         news: countNews
     });
  }else if(['LABEL', 'LABEL_STAFF']){

    // Define a base query that is modified based on the user role
let query = {};

// Check if labelId is defined, then update the query to filter by label_id
if (labelId) {
    query.label_id = labelId;
}
   // Count for each model using the potentially modified query
 // Initialize response object
 let response = {
  albums: await Album.countDocuments(query),
  artists: await Artist.countDocuments(query),
  photos: await Photo.countDocuments(query),
  events: await Event.countDocuments(query),
  news: await News.countDocuments(query),
  songs: {
      audio: await Song.countDocuments({ ...query, song_type: 'audio' }),
      video: await Song.countDocuments({ ...query, song_type: 'video' }),
      total: 0
  }
};
response.songs.total = response.songs.audio + response.songs.video;

// Sending response with counts
return res.json(response);
  }
   
} catch (error) {
    console.error("Failed to fetch stats", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
}
}
}
module.exports = methods;