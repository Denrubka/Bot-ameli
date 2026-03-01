const { Markup } = require('telegraf')
const Booking = require('../models/Booking')
const { formatDate } = require('../utils/formatters')
const config = require('../config')
const dayjs = require('dayjs')

module.exports = (bot) => {

  // ===== МОИ ЗАПИСИ =====
  bot.hears('🗂 Мои записи', async (ctx) => {
    const telegramId = ctx.from.id.toString()

    const bookings = await Booking.findAll({
      where: { telegramId },
      order: [['date', 'ASC']]
    })

    if (!bookings.length) {
      return ctx.reply('У вас пока нет записей.')
    }

    for (const booking of bookings) {
      await ctx.reply(
        `📅 ${formatDate(booking.date)}\n⏰ ${booking.time}\nТип: ${booking.type}`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              '❌ Отменить',
              `cancel_${booking.id}`
            )
          ]
        ])
      )
    }
  })


  // ===== ОТМЕНА ЗАПИСИ =====
  bot.action(/cancel_(.+)/, async (ctx) => {
    const bookingId = ctx.match[1]
    const telegramId = ctx.from.id.toString()

    const booking = await Booking.findOne({
      where: { id: bookingId, telegramId }
    })

    if (!booking) {
      return ctx.answerCbQuery('Запись не найдена')
    }

    const lessonDateTime = dayjs(`${booking.date} ${booking.time}`)
    const now = dayjs()

    const diffHours = lessonDateTime.diff(now, 'hour')

    // ❗ правило 24 часа
    if (diffHours < 24) {
      return ctx.answerCbQuery(
        '❗ Отмена возможна не позднее чем за 24 часа',
        { show_alert: true }
      )
    }

    await ctx.telegram.sendMessage(
      config.ADMIN_ID,
      `❌ Отмена записи

👤 ${ctx.from.first_name}
@${ctx.from.username || 'нет'}
📅 ${formatDate(booking.date)}
⏰ ${booking.time}
Тип: ${booking.type}`
    )

    await booking.destroy()

    await ctx.editMessageText('❌ Запись отменена')
    await ctx.answerCbQuery()
  })


  // ===== НАПИСАТЬ АМЕЛИИ =====
  bot.hears('✉️ Написать Амелии', async (ctx) => {
    ctx.session.waitingForMessageToAdmin = true
    await ctx.reply('Напишите сообщение, и я передам его Амелии.')
  })

}