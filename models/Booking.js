const { DataTypes } = require('sequelize')
const sequelize = require('../database')

module.exports = sequelize.define('Booking', {
  price: DataTypes.INTEGER,
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  type: {
    type: DataTypes.STRING // 'trial' | 'regular'
  }
})