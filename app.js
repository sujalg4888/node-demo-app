const express = require('express');
const app = express();
const mongoClient = require('./config/database');
const { initializeRedisClient } = require('./utils/redis');
const initializeRoutes = require('./routes/routes');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const ipFilter = require('./middleware/ip_whitelist');
const initializeCronJobs = require('./cron_jobs/cron');

app.use(express.json()); // Middleware for JSON
app.use(express.urlencoded({ extended: true })); // Middleware for URL-encoded data

app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:4000', 'http://localhost:3000'], // Allow only frontend origin
    methods: 'GET,POST,PUT,DELETE',  // Specify the allowed methods
    allowedHeaders: 'Content-Type, Authorization', // Specify the allowed headers
}));

app.use(ipFilter); // IP filter middleware

// Initialize routes and include multer for handling form data
initializeRoutes(app); // Pass multer to route initialization

app.use(compression()); // Compression middleware
app.use(cors()); // Cors middleware enabled
app.use(helmet()); // Headers protection middleware

async function connectToMongoAndRedis() { // Connect to MongoDB and Redis databases and start the Express server
    await mongoClient.run();
    await initializeRedisClient();
    await initializeCronJobs();
}
connectToMongoAndRedis();

module.exports = app;
