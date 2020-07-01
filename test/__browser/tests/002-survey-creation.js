const { click, button, write, into, textBox } = require('taiko')

step('Navigate to <destination>', async (destination) => {
  await click(button({ class: 'header__btn-user' }))
  await click(destination)
})

step('Create a new survey with <label> and <name>', async (name, label) => {
  await write(name, into(textBox({ placeholder: 'Name' })))
  await write(label, into(textBox({ placeholder: 'Label' })))
  await click('Create Survey')
})
