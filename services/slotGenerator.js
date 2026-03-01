const Slot = require('../models/Slot')

async function generateSlots() {
  const now = new Date()

  for (let i = 1; i <= 14; i++) {
    const date = new Date()
    date.setDate(now.getDate() + i)

    const day = date.getDay()
    if (day === 0 || day === 6) continue

    const dateStr = date.toISOString().split('T')[0]

    const times = ['10:00', '11:00', '12:00', '13:00']

    for (const time of times) {
      await Slot.findOrCreate({
        where: { date: dateStr, time }
      })
    }
  }
}

module.exports = { generateSlots }