const paymentService = require('./payment.service');

const initiatePayment = async (req, res, next) => {
  try {
    const { amount, plan, currency } = req.body;
    const result = await paymentService.initiatePayment(req.user.id, {
      amount,
      plan,
      currency,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.verifyPayment(id);

    res.json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    // La structure dépend de la Gateway (FedaPay, CinetPay, etc.)
    const { transaction_id, status } = req.body;
    
    // Mapper le statut de la gateway vers nos status internes
    const normalizedStatus = status === 'approved' ? 'successful' : 'failed';

    await paymentService.processWebhook(transaction_id, normalizedStatus);

    res.status(200).send('Webhook received');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
};
