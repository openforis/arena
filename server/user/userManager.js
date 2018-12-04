const Promise = require('bluebird')

const userRepository = require('./userRepository')

const {fetchUserGroups} = require('../authGroup/authGroupRepository')
const {comparePassword} = require('./userUtils')

// ==== READ

const findUserById = async (userId) => {
  const userFetchPromise = userRepository.findUserById(userId)

  const [user, authGroups] = await Promise.all([userFetchPromise, fetchUserGroups(userId)])

  return {...user, authGroups}
}

const findUserByEmailAndPassword = async (email, password) => {
  const user = await userRepository.findUserByEmail(email)

  if (user && await comparePassword(password, user.password)) {
    const authGroups = await fetchUserGroups(user.id)
    return {...user, authGroups}
  }

  return null
}

// ==== UPDATE

const updateUserPref = async (user, name, value) =>
  await userRepository.updateUserPref(user, name, value)

// ==== DELETE

const deleteUserPref = async (user, name) => ({
  ...(await userRepository.deleteUserPref(user, name)),
  authGroups: await fetchUserGroups(user.id)
})

module.exports = {
  // READ
  findUserById,
  findUserByEmailAndPassword,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}
