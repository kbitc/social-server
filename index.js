require('dotenv').config();

var path = require("path");
const express = require('express');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

const app = express();
const server = app.listen(PORT, function () {
    console.log('Server is running on http://localhost:' + PORT);
});

app.use(require('./routes'));
app.set('views', './views');
app.set('view engine', 'pug');