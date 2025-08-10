// functions/index.js (or index.ts for TypeScript)
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.ping = functions.https.onRequest((req, res) => {
  res.status(200).send({ message: 'Pong' });
});
