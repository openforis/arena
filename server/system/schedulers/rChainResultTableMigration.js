import * as Log from '@server/log/log'
import { db } from '@server/db/db'
import * as RChainResultMigration from '@server/modules/analysis/repository/rChainResultMigration'

const logger = Log.getLogger('RChainResultTableMigration')

export const init = async () => {
  try {
    logger.info('Initializing R chain result table migration')
    await RChainResultMigration.migrateRChainResultTable(db)
    logger.info('R chain result table migration completed')
  } catch (error) {
    logger.error('Error during R chain result table migration', error)
  }
}
