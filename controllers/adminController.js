const Admin = require("../models/dashboardUsers")
let bcrypt = require("bcrypt");
const crypto = require('crypto');
let utils = require("../utils/index");
const { sendResetPasswordMail,sendLabelInvite} = require("../utils");

let methods = {
    addAdmin: async(req,res)=>{
        try {
            let { email, password ,role} = req.body;
            if (!email || !password || !role) {
              return res.status(400).json({
                msg: "Please provide user data",
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
        
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            let admin = new Admin({ email, password: hashedPassword, user_role:role });
            let addUser = await admin.save();
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
            console.log("error",error)
          return  res.status(500).json({
              msg: "Failed to add user",
              error: error.message || "Something went wrong.",
              success: false,
            });
          }
    },
    adminLogin: async(req,res)=>{
        try {
            const { email, password } = req.body;
            if (!email || !password) {
              return res.status(401).json({
                msg: "Please enter right Credentials!",
                success: false,
              });
            }
            let admin = await Admin.findOne({ email });
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
        
            let access_token = await utils.issueToken({
              _id: admin._id,
              email:admin.email,
              role:admin.user_role
            });
        
            let result = {
              user: {
                _id: admin._id,
                email: email,
              },
              access_token,
            };
        
            return res.status(200).json({ success: true, result });
          } catch (error) {
            console.log("error",error)
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
    }

}
module.exports = methods;