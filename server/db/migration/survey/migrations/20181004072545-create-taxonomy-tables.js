'use strict'

let dbm
let type
let seed
const fs = require('fs')
const path = require('path')
let Promise

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate
  type = dbm.dataType
  seed = seedLink
  Promise = options.Promise
}

exports.up = function(db) {
  const filePath = path.join(
    __dirname,
    'sqls',
    '20181004072545-create-taxonomy-tables-up.sql',
  )
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        return reject(err)
      }

      console.log('received data: ' + data)

      resolve(data)
    })
  }).then(data => {
    return db.runSql(data)
  })
}

exports.down = function(db) {
  const filePath = path.join(
    __dirname,
    'sqls',
    '20181004072545-create-taxonomy-tables-down.sql',
  )
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        return reject(err)
      }

      console.log('received data: ' + data)

      resolve(data)
    })
  }).then(data => {
    return db.runSql(data)
  })
}

exports._meta = {
  version: 1,
}
