const { DataTypes } = require('sequelize')
const sequelize = require('../database')

module.exports = sequelize.define('Booking', {
  type: DataTypes.STRING,
  price: DataTypes.INTEGER,
  status: { type: DataTypes.STRING, defaultValue: 'pending' }
})