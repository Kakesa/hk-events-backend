const Payment = require('./payment.model');
const User = require('../users/users.model');

/**
 * Initialise un paiement
 */
const initiatePayment = async (userId, { amount, plan, currency = 'XOF' }) => {
  // 1. Créer l'enregistrement de paiement en attente
  const payment = await Payment.create({
    userId,
    amount,
    plan,
    currency,
    status: 'pending',
  });

  // 2. Préparer les données pour la Gateway (ex: FedaPay)
  // TODO: Intégrer l'API réelle ici
  // const transaction = await fedapay.transaction.create({...});
  
  // Pour l'instant, on simule une réponse avec un lien
  const mockPaymentUrl = `https://checkout.fedapay.com/mock-transaction-${payment._id}`;
  
  return {
    paymentId: payment._id,
    paymentUrl: mockPaymentUrl,
  };
};

/**
 * Vérifie le statut d'un paiement et met à jour l'utilisateur
 */
const verifyPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Paiement introuvable');

  // TODO: Appeler la Gateway pour vérifier le statut réel
  // if (payment.status === 'pending') { ... }

  return payment;
};

/**
 * Webhook : Mis à jour par la gateway
 */
const processWebhook = async (transactionId, status) => {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) return null;

  payment.status = status; // 'successful' ou 'failed'
  await payment.save();

  if (status === 'successful') {
    // ✨ Mettre à jour l'abonnement de l'utilisateur
    await User.findByIdAndUpdate(payment.userId, {
      subscriptionType: payment.plan
    });
  }

  return payment;
};

/**
 * Simulation uniquement pour démo
 */
const simulateSuccess = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) return null;

  payment.status = 'successful';
  await payment.save();

  await User.findByIdAndUpdate(payment.userId, {
    subscriptionType: payment.plan
  });

  return payment;
};

/**
 * Récupère tous les paiements (Super Admin)
 */
const getAllPayments = async () => {
  return await Payment.find().populate('userId', 'name email').sort({ createdAt: -1 });
};

/**
 * Calcule le revenu mensuel total
 */
const getMonthlyRevenue = async () => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await Payment.aggregate([
    {
      $match: {
        status: 'successful',
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return result.length > 0 ? result[0].total : 0;
};

module.exports = {
  initiatePayment,
  verifyPayment,
  processWebhook,
  getAllPayments,
  getMonthlyRevenue,
  simulateSuccess,
};
