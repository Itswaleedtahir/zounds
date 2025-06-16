// utils/sesClient.js
require('dotenv').config();           // ensure .env is loaded
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

/**
 * Create a single SESClient instance, with region & creds from env
 */
const ses = new SESClient({
  region: process.env.AWS_REGION,    
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * sendEmail
 * @param {{from:string,to:string,subject:string,body:string}} params
 */
async function sendEmail({ from, to, subject, body }) {
  const command = new SendEmailCommand({
    Source:    from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body:    { Html: { Data: body, Charset: "UTF-8" } }
    }
  });
  return ses.send(command);
}

module.exports = { sendEmail };
