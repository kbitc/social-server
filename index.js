require('dotenv').config();

const path = require('path');
const express = require('express');
const axios = require('axios');
const serveStatic = require('serve-static');
const PORT = process.env.PORT || 3000;

const app = express();

// Define routes
app.use(require('./routes'));
// Define path or admin page
app.use(serveStatic(path.join(__dirname, 'public'), {
  cacheControl: false
}));
//app.use('/', express.static('./public'));
// Set rendering mechanism. Though not used anywhere for now
app.set('views', './views');
app.set('view engine', 'pug');

const server = app.listen(PORT, function () {
    console.log('Server is running on http://localhost:' + PORT);
});

