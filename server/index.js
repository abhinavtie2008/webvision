import { createApp } from './app.js';

const port = Number(process.env.PORT || 4000);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`Sarathi concept API listening on http://localhost:${port}`);
  console.log('Demo only — mock payments, mock OTP (123456), no real personal data.');
});

function shutdown() {
  server.close(() => {
    app.locals.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
