const mongoose = require('mongoose');
const config = require('./env')
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

/** This function establishes a connection to a MongoDB database using Mongoose.
 * @async
 * @function run
 * @returns {Promise<void>} - A promise that resolves when the connection is successfully established and pinged.
 * @throws Will throw an error if the connection fails or the ping fails.
 */
exports.run = async function() {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(process.env.MONGODB_URI, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch(error){
    console.error("Failed to connect to MongoDB!", error);
  }
}
