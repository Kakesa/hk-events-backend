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

// 🔹 Parser JSON uniquement pour les requêtes application/json
// ⚠️ Les routes multipart/form-data ne passeront pas ici
app.use(express.json({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));

// 🔹 Routes principales
routes(app);

// 🔹 Middleware de gestion des erreurs
app.use(errorHandler);

module.exports = app;
