module.exports = {
  apps: [
    {
      name: "websevix",
      script: "server.js",
      cwd: "/var/www/websevix/.next/standalone",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      // Auto-restart on crash
      autorestart: true,
      watch: false,
      // Logging
      out_file: "/var/log/websevix/out.log",
      error_file: "/var/log/websevix/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
