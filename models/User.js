const { DataTypes } = require('sequelize')
const sequelize = require('../database')

module.exports = sequelize.define('User', {
  telegramId: { type: DataTypes.BIGINT, unique: true },
  ageGroup: DataTypes.STRING,
  goal: DataTypes.STRING,
  level: DataTypes.STRING,
  notifySlots: { type: DataTypes.BOOLEAN, defaultValue: true },
  trialBooked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})