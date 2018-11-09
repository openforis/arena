require('dotenv').config()

const cluster = require('cluster')
const dbMigrator = require('./db/migration/dbMigrator')
const serverCluster = require('./serverCluster')

if (cluster.isMaster) {

// ====== run database migrations in master process
  dbMigrator.migrateAll()

  // process.env.WEB_CONCURRENCY is used by Heroku
  // const numWorkers = process.env.WEB_CONCURRENCY || require('os').cpus().length
  const numWorkers = require('os').cpus().length

  console.log('Master cluster setting up ' + numWorkers + ' workers...')

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork()
  }

  cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is online')
  })

  cluster.on('exit', function (worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal)
    console.log('Starting a new worker')
    cluster.fork()
  })

} else {

  serverCluster()

}

