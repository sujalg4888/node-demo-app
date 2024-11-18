module.exports = { success: success, error: error };

/** A utility function to handle successful API responses.
 * @param {Object} res - The Express response object.
 * @param {any} data - The data to be included in the response.
 * @returns {Object} - The Express response object with a JSON body containing success status and data.
 */
function success(res, message, data, statusCode) {
  return res.status(statusCode).json({ success: true, message, data });
};

/** A middleware function to handle error API responses.
 * @param {Object} res - The Express response object.
 * @param {string} message - The error message to be included in the response.
 * @param {number} statusCode - The HTTP status code for the response.
 * @returns {Object} - The Express response object with a JSON body containing success status, error message, and HTTP status code.
 */
function error(res, message, statusCode) {
  return res.status(statusCode).json({ success: false, message });
};
