const cron = require("node-cron");
module.exports = function runTestCronJob() {
  cron.schedule("* * * * *", () => {
    console.log("Running a task every minute");
  });
};
