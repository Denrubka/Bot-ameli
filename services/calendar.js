const { Markup } = require('telegraf')
const Slot = require('../models/Slot')

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const options = { weekday: 'short', day: '2-digit', month: 'short' }
  return date.toLocaleDateString('ru-RU', options)
}

function isWeekday(dateStr) {
  const date = new Date(dateStr)
  const day = date.getDay()
  return day >= 1 && day <= 5
}

async function buildDateKeyboard() {
  const slots = await Slot.findAll({
    where: { isBooked: false, isBlocked: false }
  })

  // уникальные даты, ПН-ПТ
  const dates = [...new Set(slots.map(s => s.date))].filter(isWeekday)

  if (dates.length === 0) {
    return Markup.inlineKeyboard([[Markup.button.callback('Нет доступных дат', 'no_dates')]])
  }

  const buttons = []
  let row = []

  dates.forEach((date, i) => {
    const label = formatDate(date)
    row.push(Markup.button.callback(label, `date_${date}`))

    if ((i + 1) % 3 === 0) {
      buttons.push(row)
      row = []
    }
  })

  if (row.length) buttons.push(row)

  return Markup.inlineKeyboard(buttons)
}

async function buildTimeKeyboard(date) {
  const slots = await Slot.findAll({
    where: { date, isBooked: false, isBlocked: false }
  })

  if (!slots || slots.length === 0) {
    return Markup.inlineKeyboard([[Markup.button.callback('Нет доступных слотов', 'no_slots')]])
  }

  const buttons = slots.map(s => [Markup.button.callback(s.time, `slot_${s.id}`)])

  // кнопка назад к датам
  buttons.push([Markup.button.callback('⬅ Назад к датам', 'back_to_dates')])

  return Markup.inlineKeyboard(buttons)
}


module.exports = { buildDateKeyboard, buildTimeKeyboard, formatDate  }