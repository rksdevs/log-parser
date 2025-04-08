module.exports = {
  apps: [
    {
      name: "log-worker",
      script: "./workers/logWorkerV4.js",
    },
    {
      name: "damage-worker",
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
    {
      name: "heal-worker",
      script: "./workers/healWorkerV1.js",
    },
  ],
};
