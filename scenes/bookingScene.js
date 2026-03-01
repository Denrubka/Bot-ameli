const { Scenes, Markup } = require('telegraf')
const User = require('../models/User')
const { getAvailableDates, getTimesByDate } = require('../services/calendarService')
const { createBooking } = require('../services/bookingService')
const { notifyAdmin } = require('../services/notificationService')
const { mainMenu } = require('../keyboards/mainMenu')

const bookingScene = new Scenes.BaseScene('booking')

bookingScene.enter(async (ctx) => {
  const buttons = await getAvailableDates()
  if (!buttons.length) return ctx.reply('Нет свободных дат.')

  await ctx.reply('Выберите дату:',
    Markup.inlineKeyboard(buttons, { columns: 1 })
  )
})

bookingScene.action(/date_(.+)/, async (ctx) => {
  const date = ctx.match[1]
  const times = await getTimesByDate(date)

  await ctx.editMessageText('Выберите время:',
    Markup.inlineKeyboard(times, { columns: 2 })
  )
})

bookingScene.action(/time_(.+)/, async (ctx) => {
  const slotId = ctx.match[1]

  const telegramId = ctx.from.id.toString()
  const user = await User.findOne({ where: { telegramId } })

  const type = user.trialBooked ? 'regular' : 'trial'

  const result = await createBooking(user, slotId, type)
  if (!result) return ctx.reply('Слот занят.')

  await notifyAdmin(ctx, user, result.slot, type)

  await ctx.reply(
    '✅ Запись подтверждена!\n\nМы напомним вам за день и за час до занятия.',
    mainMenu(user)
  )
  return ctx.scene.leave()
})

module.exports = bookingScene