require('dotenv').config()

const ADMIN_ID = process.env.ADMIN_ID
const { Telegraf, Markup, session, Scenes } = require('telegraf')
const sequelize = require('./database')
const config = require('./config')

const User = require('./models/User')
const Slot = require('./models/Slot')
const Booking = require('./models/Booking')

const { buildDateKeyboard, buildTimeKeyboard, formatDate  } = require('./services/calendar')
const { scheduleLesson } = require('./services/reminders')
const { createPayment } = require('./services/payments')


const bot = new Telegraf(config.BOT_TOKEN)
const stage = new Scenes.Stage([])

const onboardingScene = require('./scenes/onboardingScene')
stage.register(onboardingScene)

bot.use(session({
  defaultSession: () => ({})
}))

bot.use(stage.middleware())

// ====== СВЯЗИ ======
User.hasMany(Booking)
Booking.belongsTo(User)
Slot.hasOne(Booking)
Booking.belongsTo(Slot)

// ====== START ======
bot.start(async (ctx) => {
  const user = await User.findOne({
    where: { telegramId: ctx.from.id }
  })

  if (!user) {
    await User.create({ telegramId: ctx.from.id })
    return ctx.scene.enter('onboarding')
  }

  if (!user.level) {
    return ctx.scene.enter('onboarding')
  }

  if (!user.trialPaid) {
    return ctx.reply(
      'Выберите дату для пробного занятия:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📅 Открыть календарь', 'open_calendar_trial')]
      ])
    )
  }

  return ctx.reply(
    'Главное меню',
    Markup.keyboard([
      ['📅 Записаться'],
      ['✉ Написать Амелии']
    ]).resize()
  )
})

// ====== Создание слотов ======
// Функция для генерации слотов на 2 недели вперед
async function seedSlots() {
  // кол-во дней для генерации
  const daysToGenerate = 14
  // часы для занятий
  const hours = ['10:00', '11:00', '12:00', '13:00']

  const today = new Date()

  for (let d = 0; d < daysToGenerate; d++) {
    const date = new Date(today)
    date.setDate(today.getDate() + d)

    // пропускаем выходные
    const dayOfWeek = date.getDay() // 0 = воскресенье, 6 = суббота
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    for (const time of hours) {
      // проверяем, нет ли уже такого слота
      const exists = await Slot.findOne({ where: { date: dateStr, time } })
      if (!exists) {
        await Slot.create({ date: dateStr, time, isBooked: false, isBlocked: false })
      }
    }
  }

  console.log('Слоты на 2 недели сгенерированы!')
}

// ====== ОПРОС ======
bot.hears('Давайте начнем', (ctx) => {
  ctx.session.step = 'age'
  ctx.reply(
    'Ваш возраст?',
    Markup.keyboard([['До 18'], ['18+']]).resize()
  )
})

bot.hears(['До 18', '18+'], async (ctx) => {
  if (ctx.session.step !== 'age') return

  const user = await User.findOne({ where: { telegramId: ctx.from.id } })
  user.ageGroup = ctx.message.text
  await user.save()

  ctx.session.step = 'goal'
  ctx.reply(
    'Цель изучения?',
    Markup.keyboard([
      ['Для себя'],
      ['Для путешествий'],
      ['Для учебы/работы'],
      ['Сдача экзамена']
    ]).resize()
  )
})

bot.on('text', async (ctx) => {
  if (ctx.session.step === 'goal') {
    const user = await User.findOne({ where: { telegramId: ctx.from.id } })
    user.goal = ctx.message.text
    await user.save()

    ctx.session.step = 'level'
    return ctx.reply(
      'Ваш уровень?',
      Markup.keyboard([
        ['A0'],
        ['A1-A2'],
        ['B1-B2'],
        ['C1+']
      ]).resize()
    )
  }

  if (ctx.session.step === 'level') {
    const user = await User.findOne({ where: { telegramId: ctx.from.id } })
    user.level = ctx.message.text
    await user.save()

    ctx.session.step = null

    return ctx.reply(
      'Спасибо! Пробное занятие — 500₽ (30 минут). Выберите дату.',
      Markup.inlineKeyboard([
        [Markup.button.callback('Открыть календарь', 'open_calendar_trial')]
      ])
    )
  }
})

// ====== КАЛЕНДАРЬ ======
bot.action('open_calendar_trial', async (ctx) => {
  try {
    await ctx.answerCbQuery()
    const keyboard = await buildDateKeyboard()
    await ctx.reply('Выберите дату:', keyboard)
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка при открытии календаря')
  }
})

bot.action(/date_(.+)/, async (ctx) => {
  try {
    const date = ctx.match[1]
    const keyboard = await buildTimeKeyboard(date)
    await ctx.editMessageText(`Дата: ${date}\nВыберите время:`, keyboard)
    await ctx.answerCbQuery()
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка при выборе времени')
  }
})

bot.action(/slot_(.+)/, async (ctx) => {
  try {
    const slotId = ctx.match[1]
    const Slot = require('./models/Slot')
    const Booking = require('./models/Booking')
    const User = require('./models/User')

    const slot = await Slot.findByPk(slotId)
    if (!slot || slot.isBooked) {
      return ctx.answerCbQuery('Этот слот уже занят', { show_alert: true })
    }

    const user = await User.findOne({ where: { telegramId: ctx.from.id } })
    await Booking.create({ userId: user.id, slotId: slot.id })

    // помечаем слот как занятый
    slot.isBooked = true
    await slot.save()

    if (ADMIN_ID) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `Новая запись на урок!\n\n` +
        `Пользователь: ${ctx.from.first_name} ${ctx.from.last_name || ''}\n` +
        `Telegram: @${ctx.from.username || '-'}\n` +
        `Дата: ${formatDate(slot.date)}\n` +
        `Время: ${slot.time}`
      )
    }

    await ctx.editMessageText(
      `Вы записаны на занятие:\n${formatDate(slot.date)} в ${slot.time}`
    )
    await ctx.answerCbQuery('Запись подтверждена!')
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка при записи на занятие')
  }
})

bot.action('back_to_dates', async (ctx) => {
  try {
    const keyboard = await buildDateKeyboard()
    await ctx.editMessageText('Выберите дату:', keyboard)
    await ctx.answerCbQuery()
  } catch (err) {
    console.error(err)
    await ctx.reply('Ошибка при возврате к датам')
  }
})

// ====== ЧАТ С АДМИНОМ ======
bot.on('message', async (ctx) => {
  if (ctx.from.id === config.ADMIN_ID) return

  await bot.telegram.sendMessage(
    config.ADMIN_ID,
    `Сообщение от ${ctx.from.id}:\n${ctx.message.text}`
  )
})

// ====== АДМИН ======
bot.command('broadcast', async (ctx) => {
  if (ctx.from.id !== config.ADMIN_ID) return

  const text = ctx.message.text.replace('/broadcast ', '')
  const users = await User.findAll()

  for (const u of users) {
    await bot.telegram.sendMessage(u.telegramId, text)
  }

  ctx.reply('Рассылка отправлена.')
})

// ====== INIT ======
async function start() {
  sequelize.sync({ alter: true }).then(async () => {
    console.log('База готова!')
  
    // генерируем слоты автоматически
    await seedSlots()
  
    // запускаем бота
    bot.launch()
    console.log('Бот запущен!')
  })
}

start()