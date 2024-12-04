const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const AWS = require("aws-sdk")
const jwt = require("jsonwebtoken");
const secret = process.env.secret
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
      jwt.sign(payload, secret, { expiresIn: "7d" }, (err, accessToken) => {
        // Change expiresIn to "7d"
        if (err) {
          reject(err);
        } else {
          jwt.sign(payload, secret, { expiresIn: "7d" }, (err) => {
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
};
