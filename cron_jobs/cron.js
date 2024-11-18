module.exports = function initializeCronJobs() {
  if (process.env.NODE_ENV == "production") {
    require("./test_cron")();
  }
};
