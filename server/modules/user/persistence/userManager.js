const Promise = require('bluebird')

const UserRepository = require('./userRepository')
const AuthGroupRepository = require('../../auth/repository/authGroupRepository')

const { comparePassword } = require('../userUtils')

// ==== READ

const findUserById = async (userId) => {
  const userFetchPromise = UserRepository.findUserById(userId)

  const [user, authGroups] = await Promise.all([userFetchPromise, AuthGroupRepository.fetchUserGroups(userId)])

  return { ...user, authGroups }
}

const findUserByEmailAndPassword = async (email, password) => {
  const user = await UserRepository.findUserByEmail(email)

  if (user && await comparePassword(password, user.password)) {
    const authGroups = await AuthGroupRepository.fetchUserGroups(user.id)
    return { ...user, authGroups }
  }

  return null
}

// ==== UPDATE

const updateUserPref = async (user, name, value) =>
  await UserRepository.updateUserPref(user, name, value)

// ==== DELETE

const deleteUserPref = async (user, name) => ({
  ...(await UserRepository.deleteUserPref(user, name)),
  authGroups: await AuthGroupRepository.fetchUserGroups(user.id)
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
