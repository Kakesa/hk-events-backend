require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
