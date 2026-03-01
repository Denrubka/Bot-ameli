const { Scenes, Markup } = require('telegraf')
const User = require('../models/User')

const onboardingScene = new Scenes.WizardScene(
  'onboarding',

  // ШАГ 1 — Возраст
  async (ctx) => {
    await ctx.reply(
      'Здравствуйте! Давайте начнем.\n\nУкажите возраст:',
      Markup.inlineKeyboard([
        [Markup.button.callback('До 18', 'age_under')],
        [Markup.button.callback('18+', 'age_over')],
        [Markup.button.callback('⬅ Назад', 'back')]
      ])
    )
    return ctx.wizard.next()
  },

  // ШАГ 2 — Цель
  async (ctx) => {
    if (ctx.callbackQuery.data === 'back') {
      return ctx.scene.leave()
    }

    ctx.wizard.state.ageGroup = ctx.callbackQuery.data
    await ctx.answerCbQuery()

    await ctx.editMessageText(
      'Цель изучения английского:',
      Markup.inlineKeyboard([
        [Markup.button.callback('Для себя', 'goal_self')],
        [Markup.button.callback('Для путешествий', 'goal_travel')],
        [Markup.button.callback('Для работы/учебы', 'goal_work')],
        [Markup.button.callback('Экзамен', 'goal_exam')],
        [Markup.button.callback('⬅ Назад', 'back')]
      ])
    )

    return ctx.wizard.next()
  },

  // ШАГ 3 — Уровень
  async (ctx) => {
    if (ctx.callbackQuery.data === 'back') {
      delete ctx.wizard.state.ageGroup
      ctx.wizard.back()
      return ctx.wizard.steps[0](ctx)
    }

    ctx.wizard.state.goal = ctx.callbackQuery.data
    await ctx.answerCbQuery()

    await ctx.editMessageText(
      'Ваш уровень английского:',
      Markup.inlineKeyboard([
        [Markup.button.callback('A0', 'level_A0')],
        [Markup.button.callback('A1-A2', 'level_A1')],
        [Markup.button.callback('B1-B2', 'level_B1')],
        [Markup.button.callback('C1+', 'level_C1')],
        [Markup.button.callback('⬅ Назад', 'back')]
      ])
    )

    return ctx.wizard.next()
  },

  // ШАГ 4 — Сохранение
  async (ctx) => {
    if (ctx.callbackQuery.data === 'back') {
      delete ctx.wizard.state.goal
      ctx.wizard.back()
      return ctx.wizard.steps[1](ctx)
    }

    ctx.wizard.state.level = ctx.callbackQuery.data
    await ctx.answerCbQuery()

    const telegramId = ctx.from.id.toString()
    const user = await User.findOne({ where: { telegramId } })

    user.ageGroup = ctx.wizard.state.ageGroup
    user.goal = ctx.wizard.state.goal
    user.level = ctx.wizard.state.level

    await user.save()

    await ctx.editMessageText(
      'Спасибо! 🎉\n\nПробное занятие — 500₽ / 30 минут.\nВыберите удобную дату:',
    )

    await ctx.reply(
      'Нажмите кнопку ниже:',
      Markup.keyboard([['📅 Пробное занятие']]).resize()
    )

    return ctx.scene.leave()
  }
)

module.exports = onboardingScene