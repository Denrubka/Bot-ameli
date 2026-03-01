const config = require('../config')
const { formatDate } = require('../utils/formatters')

async function notifyAdmin(ctx, user, slot, type) {
  const text = `
📌 Новая запись!

👤 Имя: ${user.firstName}
📱 Telegram: @${user.username || 'нет'}
📊 Уровень: ${user.level}
📅 Дата: ${formatDate(slot.date)}
⏰ Время: ${slot.time}
📚 Тип: ${type === 'trial' ? 'Пробное' : 'Обычное'}
`

  await ctx.telegram.sendMessage(config.ADMIN_ID, text)
}

async function notifyAdminAboutCancel(ctx, booking) {
  const text = `
❌ Отмена записи!

👤 ${ctx.from.first_name}
🆔 @${ctx.from.username || 'нет'}
📅 ${booking.date}
⏰ ${booking.time}
Тип: ${booking.type}
`

  await ctx.telegram.sendMessage(config.ADMIN_ID, text)
}

module.exports = { notifyAdmin, notifyAdminAboutCancel }