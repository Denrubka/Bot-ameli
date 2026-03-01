const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Booking = sequelize.define('Booking', {
  type: DataTypes.STRING // trial | regular
})

module.exports = Booking