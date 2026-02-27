const config = require('../config')

async function createPayment({ amount, description }) {

  if (config.PAYMENT_MODE === 'test') {
    return {
      id: 'test_payment',
      confirmationUrl: null
    }
  }

  // ШАБЛОН ДЛЯ ЮKASSA (потом раскомментировать)

  /*
  const YooKassa = require('yookassa')
  const { v4: uuidv4 } = require('uuid')

  const yoo = new YooKassa({
    shopId: process.env.YOOKASSA_SHOP_ID,
    secretKey: process.env.YOOKASSA_SECRET
  })

  const payment = await yoo.createPayment({
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB'
    },
    confirmation: {
      type: 'redirect',
      return_url: process.env.BASE_URL
    },
    capture: true,
    description
  }, uuidv4())

  return payment
  */
}

module.exports = { createPayment }