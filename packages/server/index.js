const express = require('express');
const cors = require('cors');
const winston = require('winston');
const expressWinston = require('express-winston');
const bodyParser = require('body-parser');
const request = require('axios');
const {google} = require('googleapis');

const client = require('./auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}", 
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) { return false; }
}));

app.listen(8000, () => {
  console.info('Listening on 8000');
  init();
});

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

app.post('/inbox-change', (req, res) => {
  console.log(res);
  res.sendStatus(200);
});

async function _watch(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const stopRes = await gmail.users.stop({
    userId: 'me',
  }).catch((err) => {
    console.log(err);
  });

  const watchRes = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: 'projects/inbox-actions-1572042678872/topics/mailbox-changes',
    },
  }).catch((err) => {
    console.log('The API returned an error: ' + err);
  });

  console.log(watchRes);
}

function init() {
  client.executeAPI(_watch);
}
