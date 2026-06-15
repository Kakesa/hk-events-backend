const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { getAllowedOrigins, corsOptions } = require('./config/cors');

const app = express();

const allowedOrigins = getAllowedOrigins();

app.use(cors(corsOptions(allowedOrigins)));
app.options(/.*/, cors(corsOptions(allowedOrigins)));

app.use(express.json({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

routes(app);

app.use(errorHandler);

module.exports = app;
