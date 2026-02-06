require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const seedSuperAdmin = require('./utils/seedSuperAdmin');

// Fonction principale de démarrage
const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDB();

    // ✨ Créer le super admin si nécessaire
    await seedSuperAdmin();

    // Démarrage du serveur
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
