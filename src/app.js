const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// 🔹 DB
connectDB();

// 🔹 CORS (SUFFISANT pour gérer OPTIONS automatiquement)
app.use(
  cors({
    origin: 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 🔹 Body parser
app.use(express.json());

// 🔹 Routes
routes(app);

// 🔹 Error handler
app.use(errorHandler);

module.exports = app;
