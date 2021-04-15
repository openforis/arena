import 'dotenv/config'

import { SRSs } from '@openforis/arena-core'

import * as appCluster from './system/appCluster'

const initialize = async () => {
  // initialize SRSs
  await SRSs.init()

  await appCluster.run()
}

initialize()

// SERVER CLUSTERING DISABLED FOR NOW
// if (cluster.isMaster) {
//
// // ====== run database migrations in master process
//   dbMigrator.migrateAll()
//
//   // process.env.WEB_CONCURRENCY is used by Heroku
//   // const numWorkers = process.env.WEB_CONCURRENCY || require('os').cpus().length
//   import * as numWorkers from 'os'.cpus().length
//
//   console.log('Master cluster setting up ' + numWorkers + ' workers...')
//
//   for (let i = 0; i < numWorkers; i++) {
//     cluster.fork()
//   }
//
//   cluster.on('online', function (worker) {
//     console.log('Worker ' + worker.process.pid + ' is online')
//   })
//
//   cluster.on('exit', function (worker, code, signal) {
//     console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal)
//     console.log('Starting a new worker')
//     cluster.fork()
//   })
//
// } else {
//
//   serverCluster()
//
// }
