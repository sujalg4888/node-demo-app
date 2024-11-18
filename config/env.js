/**
 * This module exports an object containing configuration settings for the application.
 * The settings are loaded from environment variables and .env files.
 * @module config
 * @returns {Object} An object containing configuration settings.
 */

const dotenv = require('dotenv');
const path = require('path');

// Determine the environment (default to 'development')
const env = process.env.NODE_ENV || 'development';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), `.env/.env.${env}`) });

module.exports = {
    port: process.env.PORT,

    jwtSecret: process.env.JWT_SECRET,

    mongoUri: process.env.MONGODB_URI,

    //AWS Credentials
    bucketName: process.env.S3_Bucket_Name,
    regionName: process.env.S3_Region_Name,
    bucketAccessKey: process.env.S3_Bucket_Access_Key,
    bucketSecretKey: process.env.S3_Bucket_Access_Key_Secret,

    //Email Configuration
    emailHost: process.env.EMAIL_HOST,
    emailPort: 587,
    emailAuth: {
      user: process.env.EMAIL_AUTH_NAME,
      pass: process.env.EMAIL_AUTH_PW,
    },
    sendersEmail: process.env.SENDERS_EMAIL,
    defaultCc: process.env.DEFAULT_CC,
};