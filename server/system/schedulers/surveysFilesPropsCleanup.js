import * as Log from '@server/log/log'

const Logger = Log.getLogger('SurveysFilesPropsCleanup')

import * as FileService from '@server/modules/record/service/fileService'

const cleanupSurveysFilesProps = async () => {
  try {
    Logger.debug('Cleanup invalid survey files props')

    const count = await FileService.cleanupAllSurveysFilesProps()

    Logger.debug(`${count} files with invalid props cleaned up`)
  } catch (error) {
    Logger.error(`Error cleaning up survey files props: ${error.toString()}`)
  }
}

export const init = async () => {
  await cleanupSurveysFilesProps()
}
