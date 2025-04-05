module.exports = {
  apps: [
    {
      name: "log-worker",
      script: "./workers/logWorkerV4.js",
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
      script: "./workers/mergeWorkerV4.js",
    },
    {
      name: "postgres-worker",
      script: "./workers/newPostgresWorker.js",
    },
  ],
};
