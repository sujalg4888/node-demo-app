const userServices = require("../services/user_service");
const APIResponseHandler = require("../middleware/api_response_handler");
const jwtUtils = require("../utils/jwtAuth");
const { logger } = require("../config/logger");
const uploadToServer = require("../config/multer");
const { uploadToS3, s3UploadHandler } = require("../config/aws_s3");

module.exports = {
  signUpController,
  loginInController,
  fetchUsersListController,
  uploadFilesToServer,
  verifyUser,
  fetchUserById,
  uploadFilesToS3,
  verifyEmailForPasswordReset,
  resetUserPassword
};

async function fetchUserById(req, res) {
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    if (!jwtUtils.verifyToken(req.headers.authorization)) {
      throw new Error("Unauthorized Access");
    }
    const userInfo = await userServices.fetchUserById(req.params.userId);
    await APIResponseHandler.success(res, "User Info Found", userInfo, 200);
  } catch (error) {
    logger.error(`Error occured in fetchUserById: ${error}`);
    const statusCode = error.status || 500;
    await APIResponseHandler.error(res, error.message, statusCode);
  }
}

/** Controller function for handling user sign-up.
 * @param {Object} req - The request object containing the user's sign-up details.
 * @param {Object} res - The response object to send back the server's response.
 * @returns {void}
 * @throws Will throw an error if the sign-up fails.
 * @async
 */
async function signUpController(req, res) {
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    const newUser = await userServices.signUpService(req.body);
    await APIResponseHandler.success(res, "signup successful", newUser, 200);
  } catch (error) {
    logger.error(`Error occured in signUpController: ${error}`);
    const statusCode = error.status || 500;
    await APIResponseHandler.error(res, error.message, statusCode);
  }
}

/** Controller function for handling user login.
 * @param {Object} req - The request object containing the user's login credentials.
 * @param {Object} req.body - The user's login credentials.
 * @param {string} req.body.email - The user's email.
 * @param {string} req.body.password - The user's password.
 * @param {Object} res - The response object to send back the server's response.
 * @returns {void}
 * @throws Will throw an error if the login fails.
 * @async
 */
async function loginInController(req, res) {
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    const user = await userServices.loginInService(req.body);
    await APIResponseHandler.success(res, "login successful", user, 200);
  } catch (error) {
    logger.error(`Error occured in loginInController: ${error}`);
    const statusCode = error.status || 500;
    await APIResponseHandler.error(res, error.message, statusCode);
  }
}

/** Controller function for fetching a list of all users.
 * This function requires a valid JWT token in the request headers for authorization.
 * @param {Object} req - The request object containing the user's request details.
 * @param {Object} req.headers - The request headers containing the JWT token.
 * @param {string} req.headers.authorization - The JWT token for authorization.
 * @param {Object} res - The response object to send back the server's response.
 * @throws Will throw an error if the JWT token is invalid or if fetching the users list fails.
 * @async
 */
async function fetchUsersListController(req, res) {
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    if (!jwtUtils.verifyToken(req.headers.authorization)) {
      throw new Error("Unauthorized Access");
    }
    const users = await userServices.fetchUsersListService();
    await APIResponseHandler.success(res, "users list fetched successfully", users, 200);
  } catch (error) {
    logger.error(`Error occured in fetchAllUsersController: ${error}`);
    const statusCode = error.status || 500;
    await APIResponseHandler.error(res, error.message, statusCode);
  }
}

/** Controller function for uploading files to server & requires a valid JWT token in the request headers for authorization
 * @param {Object} req - The request object containing the file upload details.
 * @param {Object} req.headers - The request headers containing the JWT token.
 * @param {string} req.headers.authorization - The JWT token for authorization.
 * @param {Object} res - The response object to send back the server's response.
 * @throws Will throw an error if the JWT token is invalid or if processing the files fails.
 * @async
 */
async function uploadFilesToServer(req, res) {
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);

    if (!jwtUtils.verifyToken(req.headers.authorization)) {
      throw new Error("Unauthorized Access");
    }

    await new Promise((resolve, reject) => {
      uploadToServer(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const files = req.files;
    if (!files || files.length === 0) {
      await APIResponseHandler.error(res, "No files were uploaded.", 400);
    }
    const updatedUserFiles = await userServices.updateUserFiles(
      req.body.userId,
      files
    );
    await APIResponseHandler.success(
      res,
      "File Uploaded successfully!",
      updatedUserFiles,
      200
    );
    logger.info(`Uploaded ${files.length} files`);
  } catch (error) {
    logger.error("Error uploading files to server:", error);
    await APIResponseHandler.error(
      res,
      error.message || "Error uploading files to server",
      400
    );
  }
}

/** This function retrieves a user by their unique ID from the request parameters and verifies their email
 * @param {Object} req - The request object containing the user's request details.
 * @param {Object} req.params - The request parameters containing the user's unique ID.
 * @param {string} req.params.id - The unique ID of the user to be verified.
 * @param {Object} res - The response object to send back the server's response.
 * @returns {Promise<void>} - A promise that resolves when the user's email is verified and the response is sent.
 * @throws Will throw an error if the user's email verification fails.
 * @async
 */
async function verifyUser(req, res) {
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    const user = await userServices.verifyUserAccount(req.params.id);
    await APIResponseHandler.success(res, "user verification success", user, 200);
  } catch (error) {
    logger.error(`Error occured in verifyUser: ${error}`);
    const statusCode = error.status || 500;
    await APIResponseHandler.error(res, error.message, statusCode);
  }
}

/** Controller function for uploading files to AWS & requires a valid JWT token in the request headers for authorization
 * @param {Object} req - The request object containing the file upload details.
 * @param {Object} req.headers - The request headers containing the JWT token.
 * @param {string} req.headers.authorization - The JWT token for authorization.
 * @param {Object} res - The response object to send back the server's response.
 * @throws Will throw an error if the JWT token is invalid or if processing the files fails.
 * @async
 */
async function uploadFilesToS3(req, res) {
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);

    if (!jwtUtils.verifyToken(req.headers.authorization)) {
      throw new Error("Unauthorized Access");
    }

    await new Promise((resolve, reject) => {
      s3UploadHandler(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    const files = req.files;
    if (!files || files.length === 0) {
      await APIResponseHandler.error(res, "No files were uploaded.", 400);
    }

    const uploadedFileData = await uploadToS3(files);
    if (uploadedFileData) {
      const updatedUserFiles = await userServices.updateUserFiles(
        req.body.userId,
        uploadedFileData
      );
      await APIResponseHandler.success(
        res,
        "File uploaded successfully!",
        updatedUserFiles,
        200
      );
    }
  } catch (error) {
    logger.error("Error uploading files to S3:", error);
    await APIResponseHandler.error(
      res,
      error.message || "Error uploading files to S3",
      400
    );
  }
}

async function verifyEmailForPasswordReset(req, res){
console.log('verifyEmailForPasswordReset controller called :', );
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    console.log('req.body :', req.body);
    const user = await userServices.verifyEmailForPasswordReset(req.body.email);
    await APIResponseHandler.success(res, "email verification success", user, 200);
  } catch (error) {
    logger.error(`Error occured in verifyEmailForPasswordReset: ${error}`);
    const statusCode = error.status || 500;
    await APIResponseHandler.error(res, error.message, statusCode);
  }
}

async function resetUserPassword(req, res){
  console.log('resetUserPassword controller called :', );
  try {
    logger.info(`Received a ${req.method} request for ${req.url}`);
    console.log('req.body :', req.body);
    const updatedUser = await userServices.resetUserPassword(req.body);
    await APIResponseHandler.success(res, "password reset success", updatedUser, 200);
  } catch (error) {
    logger.error(`Error occured in resetUserPassword: ${error}`);
    const statusCode = error.status || 500;
    await APIResponseHandler.error(res, error.message, statusCode);
  }
}
