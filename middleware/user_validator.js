const { body } = require("express-validator");

/** Regular expression for password validation.
 * Must contain at least one uppercase letter, one number, and one special character.
 * @constant {RegExp} passwordRegex
 */
const passwordRegex =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

/** Array of validation rules for user sign-up.
 * @constant {Array} signUpValidationRules
 * @property {Object} username - Validation rule for username.
 * @property {Object} email - Validation rule for email.
 * @property {Object} password - Validation rule for password.
 */
const signUpValidationRules = [
  body("username").isString().notEmpty().withMessage("Username is required"),
  body("username").isLength({ max: 15 }).withMessage("Username cannot be more than 30 characters long"),
  body("email").notEmpty().withMessage("Email is required"),
  body("email").isEmail().withMessage("Invalid email").notEmpty(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("password").isLength({ max: 30 }).withMessage("Password cannot be more than 30 characters long"),
  body("password").matches(passwordRegex).withMessage("Password must contain at least one uppercase letter, one number, and one special character"),
];

/** Array of validation rules for user login.
 * @constant {Array} loginValidationRules
 * @property {Object} email - Validation rule for email.
 * @property {Object} password - Validation rule for password.
 */
const loginValidationRules = [
  body("email").notEmpty().withMessage("Email is required"),
  body("email").isEmail().withMessage("Invalid email").notEmpty(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  body("password").isLength({ max: 30 }).withMessage("Password cannot be more than 30 characters long"),
  body("password").matches(passwordRegex).withMessage("Password must contain at least one uppercase letter, one number, and one special character"),
];

module.exports = {
  signUpValidationRules,
  loginValidationRules,
};
