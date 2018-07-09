const db = require('../db/db')

const findUserById = async (userId, client = db) => {
  const user = await client.one(`
    SELECT id, name, email FROM user WHERE id = $1
  `, [userId])

  const roles = await client.any(`
    SELECT role FROM user_role WHERE user_id = $1
  `, [user.id])

  return {...user, roles}
}

const findUserByEmailAndPassword = async (email, password) => {
return null
}

module.exports = {
  findUserById,
  findUserByEmailAndPassword
}