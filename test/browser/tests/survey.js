const { click, button, write, into, textBox } = require('taiko')

step('Navigate to <destination>', async function (destination) {
  await (async () => {
    try {
      await click(button({ class: 'header__user' }))
      await click(destination)
    } catch (error) {
      /* eslint-disable-next-line */
      console.error(error)
    }
  })()
})

step('Create a new survey with <label> and <name>', async function (name, label) {
  await write(name, into(textBox({ placeholder: 'Name' })))
  await write(label, into(textBox({ placeholder: 'Label' })))
  await click('Create Survey')
})
