const { DataTypes } = require('sequelize')
const sequelize = require('../database')

const Slot = sequelize.define('Slot', {
  date: DataTypes.STRING,
  time: DataTypes.STRING,
  isBooked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
})

module.exports = Slot