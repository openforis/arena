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

  const roles = await client.any(`
    SELECT role FROM user_role WHERE user_id = $1
  `, [user.id])

  return {...user, roles}
}

const findUserByEmailAndPassword = async (email, password) => {
  const userPwd = await  db.oneOrNone(`
    SELECT id, password 
    FROM "user" 
    WHERE LOWER(email) = LOWER($1)`
    , [email])

  return (userPwd && await comparePassword(password, userPwd.password))
    ? await findUserById(userPwd.id)
    : null

}

// ==== UPDATE

const setUserPref = async (user, name, value) => {
  const userPref = JSON.stringify(
    {[name]: value}
  )

  const userRes = await db.one(`
    UPDATE "user" 
    SET prefs = prefs || $1
    WHERE id = $2
    RETURNING ${selectFieldsCommaSep}
  `, [userPref, user.id])

  return userRes
}

module.exports = {
  // READ
  findUserById,
  findUserByEmailAndPassword,

  // UPDATE
  setUserPref
}