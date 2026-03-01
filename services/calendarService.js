const Slot = require('../models/Slot')
const { Markup } = require('telegraf')
const { formatDate } = require('../utils/formatters')

async function getAvailableDates() {
  const slots = await Slot.findAll({ where: { isBooked: false } })

  const uniqueDates = [...new Set(slots.map(s => s.date))]

  return uniqueDates.map(date =>
    Markup.button.callback(formatDate(date), `date_${date}`)
  )
}

async function getTimesByDate(date) {
  const slots = await Slot.findAll({
    where: { date, isBooked: false }
  })

  return slots.map(s =>
    Markup.button.callback(s.time, `time_${s.id}`)
  )
}

module.exports = { getAvailableDates, getTimesByDate }