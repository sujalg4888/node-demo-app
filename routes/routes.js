const userRouter = require("./user_routes");
const swaggerSpec = require('../swagger');
const swaggerUI = require('swagger-ui-express');

/**
 * Initialize routes for the API.
 * @param {express.Application} app - The Express application object.
 */
const initializeRoutes = (app) => {
    app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
    app.use("/api/v1", userRouter);
};

module.exports = initializeRoutes;
