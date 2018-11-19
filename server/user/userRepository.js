const db = require('../db/db')
const R = require('ramda')

const {comparePassword} = require('./userUtils')

const selectFields = ['id', 'name', 'email', 'prefs']
const selectFieldsCommaSep = selectFields.join(',')

// in sql queries, user table must be surrounded by "" e.g. "user"

// ==== READ

const fetchUsers = async (filter, limit, offset, client = db) =>  {
  const filterProp = R.head(R.keys(filter))
  const filterValue = R.prop(filterProp)(filter)
  const searchValue = filterValue ? R.pipe(R.trim, R.toLower)(filterValue) : null

  return await client.any(`
    SELECT ${selectFieldsCommaSep}
    FROM "user"
    WHERE ${searchValue ? `lower(${filterProp}) LIKE '%${searchValue}%'` : ''}
    LIMIT ${limit ? limit : 'ALL'}
    OFFSET $1`
  , offset)
}
// ${searchValue ? `AND lower(${propsCol}->>'${filterProp}') LIKE '%${searchValue}%'` : ''}

const findUserById = async (userId, client = db) =>
  await client.one(`
    SELECT ${selectFieldsCommaSep} FROM "user" WHERE id = $1
  `, [userId])

const findUserByEmailAndPassword = async (email, password, client = db) => {
  const userPwd = await client.oneOrNone(`
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
  fetchUsers,
  findUserById,
  findUserByEmailAndPassword,

  // UPDATE
  updateUserPref,

  // DELETE
  deleteUserPref,
}
