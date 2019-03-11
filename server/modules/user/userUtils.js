const bcrypt = require('bcrypt')

const comparePassword = bcrypt.compare

const passwordHash = async password => await bcrypt.hash(password, 10)

// at least 6 chars, 1 lower case, 1 upper case and 1 number
const passwordRegex = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})`)
const validPassword = password => passwordRegex.test(password)

module.exports = {
  comparePassword,
  passwordHash
}
