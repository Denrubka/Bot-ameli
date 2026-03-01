const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const SupportMessage = sequelize.define('SupportMessage', {
  adminMessageId: DataTypes.STRING,
  userTelegramId: DataTypes.STRING,
  userMessageId: DataTypes.STRING
})

module.exports = SupportMessage