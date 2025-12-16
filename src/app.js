const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// 🔹 Connexion à la DB
connectDB();

// 🔹 CORS
app.use(
  cors({
    origin: 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 🔹 Parser JSON pour **toutes les routes**
app.use(express.json());

// 🔹 Routes principales
routes(app);

// 🔹 Middleware de gestion des erreurs
app.use(errorHandler);

module.exports = app;
