const readline = require('readline')
const bcrypt = require('bcryptjs')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const generatePassword = () => {

  rl.question('Enter the password:\n', (password) => {

    const passwordHash = bcrypt.hashSync(password)

    console.log(`Encrypted password is: ${passwordHash}`)

    rl.close()

    process.exit()
  })
}

generatePassword()
