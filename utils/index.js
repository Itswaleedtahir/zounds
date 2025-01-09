const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk")
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const secret = process.env.secret
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
dotenv.config();
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_PASS,
  },
});
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3({
  apiVersion: "2006-03-01", // Optional, use the latest API version
  region: process.env.AWS_REGION, // Ensure the region is explicitly passed
});

module.exports = {
  generateErrorInstance({ status, message }) {
    const error = new Error(message);
    error.status = status;
    return error;
  },
  sendVerificationEmail: async (email, otp, res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: "Verify Your Account",
        html: `<p>Dear User,<br><br>
        Thank you for registering. Please enter the following OTP to verify your account: <strong>${otp}</strong><br><br>
        If you did not register, please ignore this email.<br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Verification Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      return res.status(500).json({
        msg: "Failed to send verification email",
        error: error.message || "Something went wrong."
      });
    }
  },
  ResendVerificationEmail: async (email, otp, res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: "Verify Your Account",
        html: `<p>Dear User,<br><br>
        Your otp is: <strong>${otp}</strong><br><br>
        If you did not register, please ignore this email.<br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Verification Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      return res.status(500).json({
        msg: "Failed to send verification email",
        error: error.message || "Something went wrong."
      });
    }
  },
  sendResetPasswordMail: async (email, otp, res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: "Reset your Password",
        text: "Reset your forgotten Password",
        html: `<p>Dear User,<br><br>
        Thank you for registering. Please enter the following OTP to reset your password: <strong>${otp}</strong><br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Reset Password Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      return res.status(500).json({
        msg: "Failed to send  email",
        error: error.message || "Something went wrong."
      });
    }
  },
  comparePassword: (pw, hash) => {
    return new Promise((resolve, reject) => {
      bcrypt.compare(pw, hash, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
  uploadFile: async (file, access) => {
    file.name = file.name.replace(/\s/g, "").replace("#", "").replace('"', "");
    let fileName = file.name;
    const fileExtension = file.name.substring(file.name.lastIndexOf("."));
    const fileNameWithoutExtension = `fileupload/${Date.now()}/${file.name.substring(
      0,
      file.name.lastIndexOf(".")
    )}`;
    fileName = `${fileNameWithoutExtension}${fileExtension}`;
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
      ContentDisposition: "inline",
      ContentType: file.mimetype,
      Body: file.data,
      ACL: access === "Public" ? "public-read" : undefined, // Make the file public if access is "Public"
    };
    try {
      const data = await s3.upload(uploadParams).promise();
      console.log("File uploaded successfully: ", data);
      return data;
    } catch (error) {
      console.error("Error uploading file: ", error);
      throw new Error("File upload failed");
    }
  },
  issueToken: (payload) => {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, { expiresIn: "10000d" }, (err, accessToken) => {
        // Change expiresIn to "7d"
        if (err) {
          reject(err);
        } else {
          jwt.sign(payload, secret, { expiresIn: "10000d" }, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({ accessToken });
            }
          });
        }
      });
    });
  },
  verifyToken: (token, cb) => jwt.verify(token, secret, {}, cb),
  // sendResetPasswordMail: async (email, otp, res) => {
  //   try {
  //     const info = await transporter.sendMail({
  //       from: process.env.BREVO_SENDER,
  //       to: email,
  //       subject: "Reset your Password",
  //       text: "Reset your forgotten Password",
  //       html: `<p>Dear User,<br><br>
  //       Thank you for registering. Please enter the following OTP to reset your password: <strong>${otp}</strong><br><br>
  //       Thank you,<br>
  //       The Team</p>`,
  //     });
  //     console.log("Reset Password Email sent", info.messageId);
  //   } catch (error) {
  //     console.error("Failed to send email:", error);
  //     return res.status(500).json({
  //       msg: "Failed to send  email",
  //       error: error.message || "Something went wrong."
  //     });
  //   }
  // },
  sendUserInvite: async (email, password, role,res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: `Your ${role} Credentials`,
        text: `Your ${role} Credentials`,
        html: `<p>Dear ${role},<br><br>
        Thank you for registering. Please find the provided details for the login <br><br>
         email:<strong>${email}</strong><br><br>
         password:<strong>${password}</strong><br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Reset Password Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      return res.status(500).json({
        msg: "Failed to send  email",
        error: error.message || "Something went wrong."
      });
    }
  },
  sendArtistInvite: async (email, password, res) => {
    try {
      const info = await transporter.sendMail({
        from: process.env.BREVO_SENDER,
        to: email,
        subject: "Your Label Credentials",
        text: "Your Artist Credentials",
        html: `<p>Dear Artist,<br><br>
        Thank you for registering. Please find the provided details for the login <br><br>
         email:<strong>${email}</strong><br><br>
         password:<strong>${password}</strong><br><br>
        Thank you,<br>
        The Team</p>`,
      });
      console.log("Reset Password Email sent", info.messageId);
    } catch (error) {
      console.error("Failed to send email:", error);
      return res.status(500).json({
        msg: "Failed to send  email",
        error: error.message || "Something went wrong."
      });
    }
  },

 checkRole:(requiredRoles)=> {
    return function (req, res, next) {
      // Check if the user's role is included in the list of required roles
      if (!requiredRoles.includes(req.token.role)) {
        return res.status(403).send("You dont have to access");
      }
      next();
    };
  },
  checkPermission : (...permissions) => {
    return async (req, res, next) => {
        console.log("user", req.token); // Adjusted to use req.user

        if (!req.token || !req.token.permissions) {
            return res.status(403).json({ message: 'No permissions found for user.' });
        }

        const hasAllPermissions = permissions.some((perm) => {
          console.log("pre,",perm)
            const [requiredResource, requiredAction] = perm.split(',');
            return req.token.permissions.some(permission =>
                permission.resource === requiredResource && permission.action === requiredAction
            );
        });

        if (!hasAllPermissions) {
            return res.status(403).json({ message: 'You do not have the required permissions to perform this action.' });
        }

        next();
    };
},
generateToken: () => {
  // Reduce the bytes to ensure total length remains consistent
  const randomBytes = crypto.randomBytes(14).toString('hex'); // 28 characters
  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(7, '0'); // 7 characters
  return `${randomBytes}${randomNumber}`; // Total: 35 characters
},
 generateOTP:() =>{
  return Math.floor(100000 + Math.random() * 900000).toString();
},

 uploadBufferToS3:async(filePath,access) =>{
  const fileContent = fs.readFileSync(filePath);
  // Extracting the file name from the file path
const fileName = path.basename(filePath);
console.log("mnmae",fileName)
const folderName = 'nfcs'; // Name of the folder in S3
const key = `${folderName}/${fileName}`; // Creates a path including the folder
 params = {
      Bucket: "fanzbox",
      Key: key,
      Body: fileContent,
      ACL: access === "Public" ? "public-read" : undefined, 
  };

  try {
    const data = await s3.upload(params).promise();
    console.log(`Successfully uploaded data to ${data.Location}`);
    
    return data.Location; // This returns the full URL of the uploaded file
} catch (err) {
    console.error('Error uploading data:', err);
    throw err; // Rethrow the error for handling in the calling function
}
}



};
