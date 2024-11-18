const jwt = require("jsonwebtoken");
const config = require("../config/env");

const jwtUtils = {

/** Generates a JWT token for a given user ID.
 * @function generateToken
 * @param {string} userId - The unique identifier of the user.
 * @returns {string} A JWT token.
 */
 generateToken: (userId) => {
    return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "8h" });
 },

/** Verifies a JWT token and returns its payload.
 * @function verifyToken
 * @param {string} token - The JWT token to verify.
 * @returns {object} The payload of the JWT token.
 * @throws {Error} Throws an error if the token is invalid.
 */
 verifyToken: (token) => {
    return jwt.verify(token, config.jwtSecret);
 },
};

module.exports = jwtUtils;
