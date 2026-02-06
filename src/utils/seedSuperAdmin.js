const User = require('../modules/users/users.model');

/**
 * Script de création automatique du super admin
 * Exécuté au démarrage du serveur
 */
async function seedSuperAdmin() {
  try {
    const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@eventflow.com';
    
    // Vérifier si le super admin existe déjà
    const existingSuperAdmin = await User.findOne({ 
      email: superAdminEmail 
    });
    
    if (existingSuperAdmin) {
      if (existingSuperAdmin.role !== 'superadmin') {
        existingSuperAdmin.role = 'superadmin';
        await existingSuperAdmin.save();
        console.log('✅ Utilisateur existant promu Super Admin:', superAdminEmail);
      } else {
        console.log('✅ Super admin déjà existant:', superAdminEmail);
      }
      return;
    }
    
    // Créer le super admin avec toutes les permissions
    const superAdmin = await User.create({
      name: 'Super Administrator',
      email: superAdminEmail,
      password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!',
      role: 'superadmin',
      permissions: [
        { module: 'events', create: true, read: true, update: true, delete: true },
        { module: 'guests', create: true, read: true, update: true, delete: true },
        { module: 'invitations', create: true, read: true, update: true, delete: true },
        { module: 'guestbook', create: true, read: true, update: true, delete: true },
        { module: 'analytics', create: true, read: true, update: true, delete: true },
        { module: 'users', create: true, read: true, update: true, delete: true },
        { module: 'settings', create: true, read: true, update: true, delete: true },
      ],
    });
    
    console.log('✅ Super admin créé avec succès!');
    console.log('📧 Email:', superAdmin.email);
    console.log('⚠️  ATTENTION: Changez le mot de passe par défaut en production!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création du super admin:', error.message);
    // Ne pas faire planter le serveur si le seeding échoue
  }
}

module.exports = seedSuperAdmin;
