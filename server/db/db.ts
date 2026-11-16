import type { BaseProtocol } from '@openforis/arena-server'

export { DB as db } from '@openforis/arena-server'

// db client: connection pool, task or transaction
export type DbClient = BaseProtocol
