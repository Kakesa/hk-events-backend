const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();
routes(app);

app.use(cors());
app.use(express.json());

module.exports = app;
