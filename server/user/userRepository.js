const db = require('../db/db')
const {comparePassword} = require('./userUtils')

// in sql queries, user table must be surrounded by "" e.g. "user"

const findUserById = async (userId, client = db) => {
  const user = await client.one(`
    SELECT id, name, email FROM "user" WHERE id = $1
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

module.exports = {
  findUserById,
  findUserByEmailAndPassword
}