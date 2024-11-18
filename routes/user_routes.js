const express = require("express");
const router = new express.Router();
const userController = require("../controllers/user_controller");
const { validationResult } = require("express-validator");
const { signUpValidationRules, loginValidationRules } = require("../middleware/user_validator");
const apiResponseHandler = require("../middleware/api_response_handler");
const { redisCachingMiddleware } = require("../utils/redis");
const { logger } = require('../config/logger');
const rateLimiter = require('../middleware/rate_limiter');

/** Middleware function to validate request data.
 * If validation fails, it sends an error response using the apiResponseHandler.
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @param {express.NextFunction} next - The next middleware function in the stack.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    apiResponseHandler.error(res, errors.array(), 400);
    logger.error(`Error in User Validation, ${JSON.stringify(errors.array())}`)
  }
  else next();
};
  /** POST Methods */
    /**
     * @swagger
     * '/api/v1/signup':
     *  post:
     *     tags:
     *     - User Controller
     *     summary: Create a user
     *     requestBody:
     *      required: true
     *      content:
     *        application/json:
     *           schema:
     *            type: object
     *            required:
     *              - username
     *              - email
     *              - password
     *            properties:
     *              username:
     *                type: string
     *                default: johndoe
     *              email:
     *                type: string
     *                default: johndoe@mail.com
     *              password:
     *                type: string
     *                default: johnDoe20!@
     *     responses:
     *      201:
     *        description: Created
     *      409:
     *        description: Conflict
     *      404:
     *        description: Not Found
     *      500:
     *        description: Server Error
     */
router.post( '/signup', signUpValidationRules, validate, userController.signUpController );

router.post( '/login', loginValidationRules, validate, rateLimiter(1, 100), userController.loginInController );

router.get('/users', redisCachingMiddleware(), userController.fetchUsersListController);

router.post('/uploadFiles', userController.uploadFilesToServer);

router.get('/verifyUserAccountStatus/:id', userController.verifyUser);

router.post('/uploadToS3', userController.uploadFilesToS3);

router.get('/user/:userId', userController.fetchUserById);

router.post('/verifyEmailForPasswordReset', userController.verifyEmailForPasswordReset);

router.post('/resetUserPassword', userController.resetUserPassword);

module.exports = router;
