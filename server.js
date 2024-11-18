const app = require('./app');

/** Starts the server and logs its status.
 * @function
 * @param {number} port - The port number on which the server will listen.
 * @returns {void}
 */
app.listen(process.env.PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port http://localhost:${process.env.PORT}`);
  });