const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const User = sequelize.define('User', {
  telegramId: {
    type: DataTypes.STRING,
    unique: true
  },
  username: DataTypes.STRING,
  firstName: DataTypes.STRING,
  ageGroup: DataTypes.STRING,
  goal: DataTypes.STRING,
  level: DataTypes.STRING,
  trialBooked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})

module.exports = User