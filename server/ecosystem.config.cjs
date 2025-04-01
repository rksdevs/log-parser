module.exports = {
  apps: [
    {
      name: "log-worker",
      script: "./workers/logWorker.js",
    },
    {
      name: "damage-heal-worker",
      script: "./workers/damageHealWorker.js",
    },
    {
      name: "pets-worker",
      script: "./workers/petWorker.js",
    },
    {
      name: "merge-worker",
      script: "./workers/mergeWorker.js",
    },
    {
      name: "postgres-worker",
      script: "./workers/newPostgresWorker.js",
    },
  ],
};
