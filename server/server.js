import 'dotenv/config'

import * as ProcessUtils from '@core/processUtils'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as FileService from '@server/modules/record/service/fileService'

import * as appCluster from './system/appCluster'

const initialize = async () => {
  // recursively create temp folder
  await FileUtils.mkdir(ProcessUtils.ENV.tempFolder)

  await appCluster.run()

  // run files storage check after DB migrations
  await FileService.checkFilesStorage()
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
