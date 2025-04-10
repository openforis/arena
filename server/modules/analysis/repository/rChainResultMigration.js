import * as RChainResultRepository from './rChainResultRepository'
import * as Log from '@server/log/log'

const logger = Log.getLogger('RChainResultMigration')

export const migrateRChainResultTable = async (client) => {
  try {
    // Create the r_chain_result table if it doesn't exist
    await RChainResultRepository.createRChainResultsTable(client)
    logger.info('R chain result table created or already exists')
  } catch (error) {
    logger.error('Error creating r_chain_result table:', error)
    throw error
  }
}
