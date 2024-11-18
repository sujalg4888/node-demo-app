const userModel = require("../models/user_model");
const jwtService = require("../utils/jwtAuth");
const path = require("path");
const TemplateService = require("../services/templateService");
const EmailService = require("../services/email_service");
const { logger } = require("../config/logger");
const pbkdf2 = require("pbkdf2");

module.exports = {
  signUpService,
  loginInService,
  fetchUsersListService,
  verifyUserAccount,
  updateUserFiles,
  fetchUserById,
  verifyEmailForPasswordReset,
  resetUserPassword,
};
const templateService = new TemplateService(
  path.join(__dirname, "../templates")
);
const emailService = new EmailService(templateService);

const saltLength = 16;
const iterations = 100000;
const keyLength = 64;
const digest = "sha512";

/** Hashes a password using pbkdf2.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 */
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = generateSalt(saltLength); // Generate a proper salt
    pbkdf2.pbkdf2(
      password,
      salt,
      iterations,
      keyLength,
      digest,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString("hex")}`);
      }
    );
  });
}

function generateSalt(length) {
  return [...Array(length)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

/** Verifies a password using pbkdf2.
 * @param {string} password - The password to verify.
 * @param {string} hashedPassword - The hashed password.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating if the password matches.
 */
function verifyPassword(password, hashedPassword) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hashedPassword.split(":");
    pbkdf2.pbkdf2(
      password,
      salt,
      iterations,
      keyLength,
      digest,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString("hex"));
      }
    );
  });
}

async function fetchUserById(userId) {
  try {
    const user = await userModel.findById({ _id: userId });
    if (!user) throw new Error("User Not Found");
    return user;
  } catch (error) {
    throw new Error(error);
  }
}

/** Performs user sign-up by creating a new user in the database.
 * @param {Object} signUpData - The user's sign-up data.
 * @param {string} signUpData.email - The user's email.
 * @param {string} signUpData.password - The user's password.
 * @param {string} signUpData.name - The user's name.
 * @returns {Promise<{newUser: Object, token: string}>} - A promise that resolves to an object containing the new user and the generated JWT token.
 * @throws {Error} - Throws an error if an error occurs during the sign-up process.
 */
async function signUpService(signUpData) {
  try {
    const existingUser = await userModel.findOne({ email: signUpData.email });
    if (existingUser) throw new Error("Email is already in use.");

    const hashedPassword = await hashPassword(signUpData.password);
    const newUser = new userModel({ ...signUpData, password: hashedPassword });
    await newUser.save();

    const token = await jwtService.generateToken(newUser._id);
    const username = newUser.username;
    const verificationLink = `http://localhost:4200/verify-account/${newUser._id}`;
    const templateData = { username, verificationLink };
    const emailResponse = await emailService.sendEmail(
      newUser.email,
      "Email Verification Required",
      "requestEmailVerification",
      templateData
    );
    if (emailResponse?.messageId) {
      logger.info("Email Verification request send to user " + newUser._id);
    }
    return { token };
  } catch (error) {
    console.log("error---- :", error);
    throw new Error(error);
  }
}

/** Performs user login by verifying the provided credentials and generating a JWT token.
 * @param {Object} logInData - The user's login data.
 * @param {string} logInData.email - The user's email.
 * @param {string} logInData.password - The user's password.
 * @returns {Promise<{user: Object, token: string}>} - A promise that resolves to an object containing the user and the generated JWT token.
 * @throws {Error} - Throws an error if an error occurs during the log-in process.
 */
async function loginInService(logInData) {
  try {
    const user = await userModel.findOne({
      email: logInData.email,
    });
    if (!user) throw new Error("User not found.");

    const isPasswordMatches = await verifyPassword(
      logInData.password,
      user.password
    );

    if (!isPasswordMatches) throw new Error("Incorrect password.");

    const token = await jwtService.generateToken(user._id);

    return { token };
  } catch (error) {
    throw new Error(error);
  }
}

/** Fetches all users from the database.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of user objects.
 * @throws {Error} - Throws an error if no users are found or if an error occurs during the fetch process.
 */
async function fetchUsersListService() {
  try {
    const users = await userModel.find({});
    if (!users) throw new Error("User not found.");
    else return users;
  } catch (error) {
    throw new Error(error);
  }
}

/** Verifies a user's email by updating the user's 'isEmailVerified' status to true.
 * Sends a confirmation email to the user upon successful verification.
 * @param {string} userId - The unique identifier of the user to be verified.
 * @returns {Promise<Object>} - A promise that resolves to the updated user object.
 * @throws {Error} - Throws an error if the user is not found or if an error occurs during the verification process.
 */
async function verifyUserAccount(userId) {
  try {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { isEmailVerified: true },
      { new: true }
    );
    if (!user) {
      throw new Error("User not found.");
    } else if (!user.isEmailVerified) {
      const username = user.username;
      const templateData = { username };

      const emailResponse = await emailService.sendEmail(
        user.email,
        "Email Verification Success",
        "emailVerified",
        templateData
      );
      if (emailResponse?.messageId) {
        logger.info("Email Verification Success for user " + user._id);
      }
      return user.isEmailVerified;
    }
  } catch (error) {
    throw new Error(error);
  }
}

/** Updates a user's files by pushing the provided file data to the user's 'files' array.
 * @param {string} userId - The unique identifier of the user whose files need to be updated.
 * @param {Object} fileData - The file data to be pushed to the user's 'files' array.
 * @returns {Promise<Array<Object>>} - A promise that resolves to the updated 'files' array of the user.
 * @throws {Error} - Throws an error if the user is not found or if an error occurs during the update process.
 */
async function updateUserFiles(userId, fileData) {
  try {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $push: { files: fileData } },
      { new: true }
    );
    if (!user) {
      throw new Error("User not found.");
    } else {
      return user.files;
    }
  } catch (error) {
    throw new Error(error);
  }
}

async function verifyEmailForPasswordReset(email) {
  try {
    const user = await userModel.findOne({ email });
    if (!user) throw new Error("User not found.");

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    const userName = user.username;
    const templateData = { userName, verificationCode };
    const emailResponse = await emailService.sendEmail(
      user.email,
      "OTP For Password Reset",
      "passwordResetVerificationCode",
      templateData
    );
    if (emailResponse?.messageId) {
      logger.info("Password Reset Request sent to user " + user._id);
    }
    return { verificationCode };
  } catch (error) {
    throw new Error(error);
  }
}

async function resetUserPassword(updateBody) {
  try {
    const hashedPassword = await hashPassword(updateBody.newPassword);
    const updatedUser = await userModel.findOneAndUpdate(
      { email: updateBody.email },
      { password: hashedPassword },
      { new: true }
    );
    return { hashedPassword, updatedUser };
  } catch (error) {
    throw new Error(error);
  }
}
