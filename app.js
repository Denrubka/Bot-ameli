const { Telegraf, session, Scenes } = require('telegraf')
const { Markup } = require('telegraf')
const sequelize = require('./database')
const config = require('./config')
const { formatDate } = require('./utils/formatters')

const User = require('./models/User')
const Slot = require('./models/Slot')
const Booking = require('./models/Booking')
const SupportMessage = require('./models/SupportMessage')

const onboardingScene = require('./scenes/onboardingScene')
const bookingScene = require('./scenes/bookingScene')
const { generateSlots } = require('./services/slotGenerator')
const { mainMenu } = require('./keyboards/mainMenu')

const { notifyAdminAboutCancel } = require('./services/notificationService')

User.hasMany(Booking)
Booking.belongsTo(User)
Slot.hasMany(Booking)
Booking.belongsTo(Slot)

const bot = new Telegraf(config.BOT_TOKEN)

bot.use(session())

const stage = new Scenes.Stage([onboardingScene, bookingScene])
bot.use(stage.middleware())

bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString()

  let user = await User.findOne({ where: { telegramId } })

  if (!user) {
    user = await User.create({
      telegramId,
      username: ctx.from.username,
      firstName: ctx.from.first_name
    })

    return ctx.scene.enter('onboarding')
  }

  return ctx.reply('Добро пожаловать!', mainMenu(user))
})

bot.hears('📅 Пробное занятие', (ctx) => ctx.scene.enter('booking'))

bot.hears('📅 Записаться на занятие', (ctx) => ctx.scene.enter('booking'))

bot.hears('🏠 Главное меню', async (ctx) => {
  const telegramId = ctx.from.id.toString()
  const user = await User.findOne({ where: { telegramId } })

  await ctx.reply('Главное меню:', mainMenu(user))
})

bot.on('message', async (ctx) => {

  // 1️⃣ Сначала проверяем ответ админа
  if (ctx.from.id.toString() === config.ADMIN_ID) {
    if (!ctx.message.reply_to_message) return
  
    const repliedMessageId = ctx.message.reply_to_message.message_id
  
    const supportMessage = await SupportMessage.findOne({
      where: { adminMessageId: repliedMessageId }
    })
  
    if (!supportMessage) return
  
    await ctx.telegram.sendMessage(
      supportMessage.userTelegramId,
      `💬 Ответ Амелии:\n\n${ctx.message.text}`,
      {
        reply_to_message_id: supportMessage.userMessageId
      }
    )
  
    return
  }

  // 2️⃣ Если это ученик в режиме поддержки
  if (ctx.session?.supportMode) {

    const telegramId = ctx.from.id.toString()

    const user = await User.findOne({ where: { telegramId } })

    const messageText = `
📩 Сообщение от ученика:

👤 ${user.firstName}
📱 @${user.username || 'нет'}

${ctx.message.text}
`

    const sentMessage = await ctx.telegram.sendMessage(
      config.ADMIN_ID,
      messageText
    )

    await SupportMessage.create({
      adminMessageId: sentMessage.message_id,
      userTelegramId: telegramId,
      userMessageId: ctx.message.message_id
    })

    ctx.session.supportMode = false

    await ctx.reply('Сообщение отправлено Амелии ✅')

    return
  }

})

bot.on('text', (ctx) => {
  console.log('TEXT:', ctx.message.text)
})

bot.on('text', async (ctx, next) => {

  const text = ctx.message.text

  if (text === '🗂 Мои записи') {
    return bot.handleUpdate({
      ...ctx.update,
      message: ctx.message
    })
  }

  if (text === '✉️ Написать Амелии') {
    ctx.session.waitingForMessageToAdmin = true
    return ctx.reply('Напишите сообщение, и я передам его Амелии.')
  }

  return next()
})

sequelize.sync().then(async () => {
  await generateSlots()
  require('./handlers/userMenu')(bot)
  bot.launch()
})