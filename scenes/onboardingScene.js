const { Scenes, Markup } = require('telegraf')
const User = require('../models/User')

const onboardingScene = new Scenes.WizardScene(
  'onboarding',

  // ШАГ 1 — возраст
  async (ctx) => {
    await ctx.reply(
      'Сколько вам лет?',
      Markup.keyboard([
        ['До 18'],
        ['18+'],
        ['⬅ Назад']
      ]).resize()
    )
    return ctx.wizard.next()
  },

  // ШАГ 2 — цель
  async (ctx) => {
    if (ctx.message.text === '⬅ Назад') {
      return ctx.scene.reenter()
    }

    const user = await User.findOne({
      where: { telegramId: ctx.from.id }
    })

    user.ageGroup = ctx.message.text
    await user.save()

    await ctx.reply(
      'Ваша цель изучения?',
      Markup.keyboard([
        ['Для себя'],
        ['Для путешествий'],
        ['Для учебы/работы'],
        ['Сдача экзамена'],
        ['⬅ Назад']
      ]).resize()
    )

    return ctx.wizard.next()
  },

  // ШАГ 3 — уровень
  async (ctx) => {
    if (ctx.message.text === '⬅ Назад') {
      return ctx.wizard.back()
    }

    const user = await User.findOne({
      where: { telegramId: ctx.from.id }
    })

    user.goal = ctx.message.text
    await user.save()

    await ctx.reply(
      'Ваш уровень английского?',
      Markup.keyboard([
        ['A0'],
        ['A1-A2'],
        ['B1-B2'],
        ['C1+'],
        ['⬅ Назад']
      ]).resize()
    )

    return ctx.wizard.next()
  },

  // ФИНАЛ
  async (ctx) => {
    if (ctx.message.text === '⬅ Назад') {
      return ctx.wizard.back()
    }

    const user = await User.findOne({
      where: { telegramId: ctx.from.id }
    })

    user.level = ctx.message.text
    await user.save()

    await ctx.reply(
      'Спасибо 🌸\n\nПробное занятие — 500₽ (30 минут)',
      Markup.removeKeyboard()
    )

    await ctx.reply(
      'Выберите дату:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📅 Открыть календарь', 'open_calendar_trial')]
      ])
    )

    return ctx.scene.leave()
  }
)

module.exports = onboardingScene