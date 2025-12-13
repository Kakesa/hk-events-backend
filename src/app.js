const express = require('express');
const app = express();
require('dotenv').config();
const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

connectDB();

app.use(express.json());
routes(app);
app.use(errorHandler);

module.exports = app;
