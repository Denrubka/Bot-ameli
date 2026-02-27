const schedule = require('node-schedule')

function scheduleLesson(bot, booking, slot) {
  const lessonDate = new Date(`${slot.date} ${slot.time}`)

  const oneHour = new Date(lessonDate.getTime() - 60 * 60 * 1000)
  const tenMin = new Date(lessonDate.getTime() - 10 * 60 * 1000)

  schedule.scheduleJob(oneHour, () => {
    bot.telegram.sendMessage(
      booking.UserId,
      '⏰ Через час занятие!'
    )
  })

  schedule.scheduleJob(tenMin, () => {
    bot.telegram.sendMessage(
      booking.UserId,
      '🔔 Через 10 минут занятие. Ссылка: https://telemost.yandex.ru/...'
    )
  })
}

module.exports = { scheduleLesson }