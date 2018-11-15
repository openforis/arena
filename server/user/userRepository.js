const db = require('../db/db')
const {comparePassword} = require('./userUtils')

const selectFields = ['id', 'name', 'email', 'prefs']
const selectFieldsCommaSep = selectFields.join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

// ==== READ
const findUserById = async (userId, client = db) => {
  const user = await client.one(`
    SELECT ${selectFieldsCommaSep} FROM "user" WHERE id = $1
  `, [userId])

  const groups = await client.any(`
    SELECT * FROM auth_group_user WHERE user_id = $1
  `, [user.id])

  return {...user, groups}
}

const findUserByEmailAndPassword = async (email, password) => {
  const userPwd = await db.oneOrNone(`
    SELECT id, password 
    FROM "user" 
    WHERE LOWER(email) = LOWER($1)`
    , [email])

  return (userPwd && await comparePassword(password, userPwd.password))
    ? await findUserById(userPwd.id)
    : null

}

// ==== UPDATE

const updateUserPref = async (user, name, value, client = db) => {
  const userPref = JSON.stringify(
    {[name]: value}
  )

  const userRes = await client.one(`
    UPDATE "user" 
    SET prefs = prefs || $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [userPref, user.id])

  return userRes
}

// ==== DELETE
const deleteUserPref = async (user, name, client = db) => {
  const userRes = await client.one(`
    UPDATE "user" 
    SET prefs = prefs - $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [name, user.id])

  return userRes
}

module.exports = {
  // READ
  findUserById,
  findUserByEmailAndPassword,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}