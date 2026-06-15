require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const seedSuperAdmin = require('./utils/seedSuperAdmin');
const { verifyEmailTransport } = require('./services/email.service');

// Fonction principale de démarrage
const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDB();

    // ✨ Créer le super admin si nécessaire
    await seedSuperAdmin();

    await verifyEmailTransport();

    // Démarrage du serveur
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT}`);
      console.log(`📱 Accès local: http://localhost:${PORT}`);
    });

    // Envoi d'invitations en masse : éviter coupure avant la fin (nginx/proxy)
    server.timeout = 5 * 60 * 1000;
    server.keepAliveTimeout = 65 * 1000;
    server.headersTimeout = 66 * 1000;
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
