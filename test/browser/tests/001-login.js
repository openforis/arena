const { goto, write, click, into, textBox } = require('taiko')

step('Login with <username> and <password>', async (username, password) => {
  await goto('localhost:9090')
  await write(username, into(textBox({ placeholder: 'Your email' })))
  await write(password, into(textBox({ placeholder: 'Your password' })))
  await click('Login')
})
