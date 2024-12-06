const Users= require("../models/user");
const { generateErrorInstance, sendVerificationEmail, ResendVerificationEmail ,sendResetPasswordMail,comparePassword,uploadFile,issueToken} = require("../utils");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const Preference = require("../models/preferences")
module.exports = {
  addUser: async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: "Please provide user data", success: false });
        }
        let userData = await Users.findOne({ email: email });
        if (userData) {
            return res.status(404).json({ msg: "User already exists", success: false });
        }

        // Generate a 4-digit OTP
        const otp = crypto.randomInt(1000, 9999);

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const addUser = new Users({ email, password: hashedPassword, otp });
        await addUser.save();

        // Send the OTP email
        await sendVerificationEmail(email, otp, res);

        return res.status(200).json({ user: addUser, msg: "OTP sent to your email", success: true });
    } catch (error) {
        console.error("error", error);
        return res.status(500).json({ msg: "Failed to add user", error: error.message, success: false });
    }
},

verifyUser: async (req, res) => {
  try {
      const { email, otp } = req.body;
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
      const newOtp = crypto.randomInt(1000, 9999);
      user.otp = newOtp;
      await user.save();

      // Send the OTP email
      await ResendVerificationEmail(email, newOtp, res);
      return res.status(200).json({ msg: "OTP resent successfully", otp: newOtp, success: true });
  } catch (error) {
      return res.status(500).json({ msg: "Failed to resend OTP", error: error.message, success: false });
  }
},

login: async (req, res) => {
  try {
      const { email, password } = req.body;
      if (!email || !password) {
          throw generateErrorInstance({ status: 400, message: "Required fields can't be empty" });
      }
      let user = await Users.findOne({ email });
      if (!user) {
          throw generateErrorInstance({ status: 404, message: "User not found" });
      }
      const passwordMatched = await bcrypt.compare(password, user.password);
      if (!passwordMatched) {
          throw generateErrorInstance({ status: 401, message: "Invalid Password" });
      }
      let access_token = await issueToken({
        _id: user._id,
        email:user.email,
      });

      return res.status(200).send({ user, access_token });
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
      const newOtp = crypto.randomInt(1000, 9999);
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
userPrefrences: async(req,res)=>{
  try {
    let user_id = req.token._id;
    const {  artistsSelected, genreSelected, artistContent } = req.body;
    const { gender, dob, zipcode } = req.body;

    // Find the user and update it
    const user = await Users.findByIdAndUpdate(user_id, {
        $set: {
            gender,
            dob,
            zipcode
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
};
