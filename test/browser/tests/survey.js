const { click, button, write, into, textBox, waitFor } = require('taiko')

// TODO it should be improved: wait for the loader div to disappear
const waitForLoadComplete = async () => {
  // await waitFor(async () => await waitFor($('.loader).exists()))
  await waitFor(5000)
}

step('Navigate to <destination>', async (destination) => {
  await click(button({ class: 'header__btn-user' }))
  await click(destination)
})

step('Create a new survey with <label> and <name>', async function (name, label) {
  await write(name, into(textBox({ placeholder: 'Name' })))
  await write(label, into(textBox({ placeholder: 'Label' })))
  await click('Create Survey')
  await waitForLoadComplete()
})
