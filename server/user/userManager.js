const Promise = require('bluebird')

const userRepository = require('./userRepository')

const {fetchUserGroups} = require('../authGroup/authGroupRepository')

// ==== READ

const findUserById = async (userId) => {
  const userFetchPromise = userRepository.findUserById(userId)

  const [user, authGroups] = await Promise.all([userFetchPromise, fetchUserGroups(userId)])

  return {...user, authGroups}
}

const findUserByEmailAndPassword = async (email, password) => {
  const user = await userRepository.findUserByEmailAndPassword(email, password)

  const authGroups = await fetchUserGroups(user.id)

  return {...user, authGroups}
}

// ==== UPDATE

const updateUserPref = async (user, name, value) =>
  await userRepository.updateUserPref(user, name, value)

// ==== DELETE

const deleteUserPref = async (user, name) =>
  await userRepository.deleteUserPref(user, name)

module.exports = {
  // READ
  findUserById,
  findUserByEmailAndPassword,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}
