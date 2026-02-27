const { DataTypes } = require('sequelize')
const sequelize = require('../database')

module.exports = sequelize.define('Slot', {
  date: DataTypes.STRING,
  time: DataTypes.STRING,
  isBooked: { type: DataTypes.BOOLEAN, defaultValue: false },
  isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false }
})