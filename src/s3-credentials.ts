// import dotenv from "dotenv";
const dotenv = require('dotenv');


dotenv.config()

export function s3Credentials() {
    const s3Credentials = {
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    }

    return s3Credentials
}

export function s3Url() {
    return process.env.S3_URL
}