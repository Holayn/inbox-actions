const express = require('express');
const cors = require('cors');
const winston = require('winston');
const expressWinston = require('express-winston');
const bodyParser = require('body-parser');
const request = require('axios');
const {google} = require('googleapis');

const client = require('./auth');

require('@google-cloud/debug-agent').start();

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
  expressFormat: false,
  colorize: true,
  ignoreRoute: function (req, res) { return false; }
}));

app.listen(process.env.PORT || 8080, () => {
  console.info('Listening');
  init();
});

app.get('/test', (req, res) => {
  res.sendStatus(200);
});

app.post('/inbox-change', async (req, res) => {
  console.log('got inbox change');
  const data = req.body.message.data;
  const json = new Buffer(data, 'base64').toString('ascii');
  const obj = await JSON.parse(json);
  const historyId = obj && obj.historyId;
  
  await client.executeAPI(_history.bind(null, historyId));
  
  // const stopRes = await gmail.users.message.get({
  //   userId: 'me',
  //   id:
  // }).catch((err) => {
  //   console.log(err);
  // });
  res.sendStatus(200);
});

async function _history(startHistoryId, auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const historyRes = await gmail.users.history.list({
    userId: 'me',
    startHistoryId,
  }).catch((err) => {
    console.error('error: ' + err);
  });
  console.log(historyRes.data);
  return historyRes.data;
}

// todo: need to call this every 7 days
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

  console.log('watching inbox');
  console.log(watchRes.data);
}

function init() {
  client.executeAPI(_watch);
}
