'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// - setup -
const FILES_DIR = __dirname + '/text-files';
// create the express app
const app = express();

// - use middleware -
// allow Cross Origin Resource Sharing
app.use(cors());
// parse the body
app.use(bodyParser.raw({ type: 'text/plain' }));;
app.use(bodyParser.json());

// https://github.com/expressjs/morgan#write-logs-to-a-file
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: accessLogStream }));
// and log to the console
app.use(morgan('dev'));

// statically serve the frontend
app.use(express.static('public'));

// - declare routes -

// read all file names
app.get('/files/', (req, res, next) => {
  fs.readdir(FILES_DIR, (err, list) => {
    if (err) {
      // https://expressjs.com/en/guide/error-handling.html
      next(err);
      return;
    }
    if (!list) {
      res.status(404).end();
      return;
    }

    res.json(list);
  });
});

// read a file
app.get('/files/:name', (req, res, next) => {
  const fileName = req.params.name;
  fs.readFile(`${FILES_DIR}/${fileName}`,'utf-8', (err, fileText) => {
    if (!fileText) {
      res.status(404).end();
      return;
    }
    if (err) {
      next(err);
      return;
    }

    const responseData = {
      name: fileName,
      text: fileText,
    };
    res.json(responseData);
  });
});

// write a file
// POST http://localhost:8080/files/shopping-list
app.post('/files/:filename', (req, res, next) => {
  const fileName = req.params.filename;
  const fileText = req.body.text;

  console.log(req.body)

  fs.writeFile(`${FILES_DIR}/${fileName}`, fileText, err => {
    if (err) {
      next(err);
      return;
    }

    // https://stackoverflow.com/questions/33214717/why-post-redirects-to-get-and-put-redirects-to-put
    res.redirect(303, 'http://localhost:8080/files');
  });
});

// delete a file
app.delete('/files/:name', (req, res, next) => {
  const fileName = req.params.name;
  fs.unlink(`${FILES_DIR}/${fileName}`, err => {
    if (err && err.code === 'ENOENT') {
      console.log(err);
      next(err)
      return;
    }
    if (err) {
      console.log(err);
      next(err);
      return;
    }

    res.redirect(303, '/files');
  });
});

// - handle errors in the routes and middleware -

// https://expressjs.com/en/guide/error-handling.html
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).end();
});

// - open server -
// try to exactly match the message logged by demo.min.js
app.listen(
  config.PORT,
  () => {
    console.log(`App listening at http://localhost:${config.PORT} (${config.MODE} mode)`);
  }
);;
