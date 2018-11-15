const userRepository = require('./userRepository')

const {getUserGroups} = require('../authGroup/authGroupRepository')

// ==== READ

const findUserById = async (userId) => {
  const user = userRepository.findUserById(userId)
  const groups = getUserGroups(userId)

  return {...(await user), groups: await groups}
}

const findUserByEmailAndPassword = (email, password) =>
  userRepository.findUserByEmailAndPassword(email, password)

// ==== UPDATE

const updateUserPref = (user, name, value) =>
  userRepository.updateUserPref(user, name, value)

// ==== DELETE

const deleteUserPref = (user, name) =>
  userRepository.deleteUserPref(user, name)

module.exports = {
  // READ
  findUserById,
  findUserByEmailAndPassword,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}
