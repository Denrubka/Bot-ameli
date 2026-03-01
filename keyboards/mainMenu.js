const { Markup } = require('telegraf')

function mainMenu(user) {
  if (!user.trialBooked) {
    return Markup.keyboard([
      ['📅 Пробное занятие'],
      ['🏠 Главное меню']
    ]).resize()
  }

  return Markup.keyboard([
    ['📅 Записаться на занятие'],
    ['🗂 Мои записи'],
    ['✉️ Написать Амелии'],
    ['🏠 Главное меню']
  ]).resize()
}

module.exports = { mainMenu }