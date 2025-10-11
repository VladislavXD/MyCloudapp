const crypto = require('crypto');

class PaymeHelper {
  constructor() {
    this.merchantId = process.env.PAYME_MERCHANT_ID || '65b78f9f3c319dec9d89218f';
    this.secretKey = process.env.PAYME_SECRET_KEY || 'n1qqWene%o6TTaorOPyk3M#wiqqRuCbTJoZD';
    this.url = process.env.PAYME_URL || 'https://checkout.paycom.uz';
  }

  // Generate authorization header for Payme API
  generateAuthHeader() {
    const credentials = `Paycom:${this.secretKey}`;
    return 'Basic ' + Buffer.from(credentials).toString('base64');
  }

  // Create checkout URL (ПРАВИЛЬНЫЙ ФОРМАТ согласно документации Payme)
  createCheckoutUrl(orderId, amount, returnUrl) {
    // amount in tiyin (1 UZS = 100 tiyin)
    const amountInTiyin = Math.round(amount * 100);

    // Validate merchant ID
    if (!this.merchantId || this.merchantId.length === 0) {
      console.error('❌ PAYME_MERCHANT_ID is not configured!');
      throw new Error('PAYME_MERCHANT_ID is not configured');
    }
    
    // Validate amount
    if (amountInTiyin < 100) {
      throw new Error('Amount too small: minimum 1 UZS (100 tiyin)');
    }
    
    // Формат согласно официальной документации Payme:
    // https://developer.help.paycom.uz/initsializatsiya-platezhey/
    // Параметры: m=merchant_id;ac.field=value;a=amount;c=return_url
    
    // Validate merchant ID format (must be 24 characters)
    if (this.merchantId.length !== 24) {
      console.error(`❌ Invalid PAYME_MERCHANT_ID length: ${this.merchantId.length} (expected 24)`);
      throw new Error(`Invalid PAYME_MERCHANT_ID: must be 24 characters, got ${this.merchantId.length}`);
    }
    
    // Строим параметры как строку (НЕ JSON!)
    let params = `m=${this.merchantId};ac.order_id=${orderId};a=${amountInTiyin}`;
    
    // Add return URL if provided (URL-кодируем, чтобы избежать конфликтов с ?, =, & и т.д.)
    if (returnUrl) {
      // URL-encode the return URL to avoid conflicts with special characters
      const encodedReturnUrl = encodeURIComponent(returnUrl);
      params += `;c=${encodedReturnUrl}`;
    }
    
    // Кодируем в base64
    const base64Params = Buffer.from(params).toString('base64');
    const fullUrl = `${this.url}/${base64Params}`;

    console.log('🔗 Payme Checkout URL Generated:');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Amount: ${amount} UZS (${amountInTiyin} tiyin)`);
    console.log(`   Merchant ID: ${this.merchantId} (length: ${this.merchantId.length})`);
    console.log(`   Return URL: ${returnUrl || 'not provided'}`);
    console.log(`   Params: ${params}`);
    console.log(`   Base64: ${base64Params}`);
    console.log(`   Full URL: ${fullUrl}`);

    return fullUrl;
  }

  // Verify Payme request signature
  verifySignature(request) {
    // Payme uses Basic Auth with format: Basic base64(MerchantID:SecretKey)
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.error('❌ Payme Auth: Missing or invalid Authorization header');
      return false;
    }

    try {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
      const [username, password] = credentials.split(':');

      // Check both formats: Paycom:SecretKey (old) and MerchantID:SecretKey (correct)
      const isValid = (username === 'Paycom' && password === this.secretKey) ||
                      (username === this.merchantId && password === this.secretKey);
      
      if (!isValid) {
        console.error('❌ Payme Auth: Invalid credentials');
        console.error('   Expected MerchantID:', this.merchantId);
        console.error('   Received username:', username);
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Payme Auth: Error parsing credentials:', error.message);
      return false;
    }
  }

  // Format amount to tiyin
  toTiyin(amount) {
    return Math.round(amount * 100);
  }

  // Format amount from tiyin
  fromTiyin(amountInTiyin) {
    return amountInTiyin / 100;
  }

  // Error codes according to Payme documentation
  static ERRORS = {
    // System errors
    SYSTEM_ERROR: -32400,              // System unavailable
    METHOD_NOT_FOUND: -32601,          // Method not found
    INSUFFICIENT_PRIVILEGE: -32504,    // Authorization failed
    
    // Amount errors
    INVALID_AMOUNT: -31001,            // Invalid amount
    
    // Transaction errors
    TRANSACTION_NOT_FOUND: -31003,     // Transaction not found
    COULD_NOT_PERFORM: -31008,         // Cannot perform transaction
    COULD_NOT_CANCEL: -31007,          // Cannot cancel transaction
    
    // Account errors (use range -31050 to -31099)
    INVALID_ACCOUNT: -31050,           // Account not found (order/user)
    USER_NOT_FOUND: -31051,            // User not found
    ORDER_NOT_FOUND: -31052,           // Order not found
    ORDER_ALREADY_PAID: -31053         // Order already paid
  };

  // Transaction states according to Payme documentation
  static STATES = {
    CREATED: 1,                        // Transaction created, waiting for payment
    COMPLETED: 2,                      // Payment completed successfully
    CANCELLED: -1,                     // Cancelled before completion
    CANCELLED_AFTER_COMPLETE: -2       // Cancelled after completion (refund)
  };

  // Cancellation reason codes
  static CANCEL_REASONS = {
    TIMEOUT: 4,                        // Transaction timeout (12 hours)
    REFUND_BY_MERCHANT: 5,            // Refunded by merchant
    REFUND_BY_PAYME: 1                // Refunded by Payme
  };
}

module.exports = PaymeHelper;