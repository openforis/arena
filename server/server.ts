import 'dotenv/config'
import './system/appVersionEnv'

import * as ProcessUtils from '@core/processUtils'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as appCluster from './system/appCluster'

const initialize = async () => {
  // recursively create temp folder
  await FileUtils.mkdir(ProcessUtils.ENV.tempFolder)

  await appCluster.run()
}

void initialize()
