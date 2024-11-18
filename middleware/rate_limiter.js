const rateLimit = require('express-rate-limit');

const rateLimiter = (max, time) => {
  return rateLimit({
    windowMs: 60 * time, // converting time to milliseconds
    max: max, // maximum number of requests allowed in the windowMs
    message: 'Too many requests, please try again later.',
  });
};

module.exports = rateLimiter;
