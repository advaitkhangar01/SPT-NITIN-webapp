module.exports = {
  apps: [
    {
      name: "spt-webapp",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
      },
    },
  ],
};
