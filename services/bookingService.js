const Slot = require('../models/Slot')
const Booking = require('../models/Booking')

async function createBooking(user, slotId, type) {
  const slot = await Slot.findByPk(slotId)
  if (!slot || slot.isBooked) return null

  slot.isBooked = true
  await slot.save()

  const booking = await Booking.create({
    type,
    UserId: user.id,
    SlotId: slot.id
  })

  if (type === 'trial') {
    user.trialBooked = true
    await user.save()
  }

  return { booking, slot }
}

module.exports = { createBooking }