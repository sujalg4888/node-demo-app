const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { Readable } = require("stream");
const { logger } = require("./logger");
const multer = require("multer");

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.S3_Region_Name,
  credentials: {
    accessKeyId: process.env.S3_Bucket_Access_Key,
    secretAccessKey: process.env.S3_Bucket_Access_Key_Secret,
  },
});

const storage = multer.memoryStorage();
const s3UploadHandler = multer({ storage: storage }).array("files", 10); // Allow up to 10 files

// Generates a unique filename for the uploaded file.
function generateFilename(file) {
  return file.fieldname + "-" + file.originalname + "-" + Date.now();
}

/** Uploads files to AWS S3.
 * @param {Array<Object>} files - An array of file objects to be uploaded.
 * @returns {Promise<Array<Object>>} An array of S3 upload responses.
 */
async function uploadToS3(files) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("No files uploaded");
  }

  const uploadPromises = files.map((file) => {
    if (!file || !file.buffer) {
      throw new Error("File buffer is empty");
    }

    const fileStream = Readable.from(file.buffer);
    const params = {
      Bucket: process.env.S3_Bucket_Name,
      Key: `${file.originalname}/${generateFilename(file)}`,
      Body: fileStream,
    };

    return new Upload({ client: s3Client, params }).done();
  });

  try {
    const uploadedFilesData = await Promise.all(uploadPromises);
    uploadedFilesData.forEach((fileData) => {
      logger.info(`Successfully uploaded file to S3: ${fileData.Location}`);
    });
    return uploadedFilesData;
  } catch (err) {
    logger.error(`Error occurred while uploading files to S3: ${err}`);
    throw err;
  }
}

module.exports = { uploadToS3, s3UploadHandler };
