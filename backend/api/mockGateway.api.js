import { getGatewayStatus, setGatewayMode } from '../utils/paymentGateway.js';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const toggleGatewayStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Missing boolean isActive' });
    }

    const mode = isActive ? 'closed' : 'open';
    const gateway = setGatewayMode(mode);

    return res.status(200).json({ success: true, message: isActive ? 'Cổng thanh toán ĐÃ MỞ (NORMAL)' : 'Cổng thanh toán ĐÃ TẮT (TIMEOUT)', gateway });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const processMockPayment = async (req, res) => {
  const gateway = getGatewayStatus();

  try {
    if (gateway.mode === 'open') {
      await delay(5000);
      return res.status(408).json({ success: false, message: 'Payment Gateway Timeout' });
    }

    // Simulate normal payment processing
    await delay(500);

    const transactionId = `TXN_${Math.floor(Math.random() * 1e9)}`;

    return res.status(200).json({ success: true, transaction_id: transactionId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal mock gateway error' });
  }
};
