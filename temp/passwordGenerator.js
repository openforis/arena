const {passwordHash} = require('../server/modules/user/userUtils')

if (process.argv.length < 3) {
  console.log('Password is mandatory. Example usage: ')
  console.log('node temp/passwordGenerator.js my-password')
  process.exit()
}

const generatePasswordHash = async () => {
  const pwd = process.argv[2]
  console.log(`Generated hash password of ${pwd} is`)
  console.log(await passwordHash(pwd))
}

generatePasswordHash()
