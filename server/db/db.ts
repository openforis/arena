import type { BaseProtocol } from '@openforis/arena-server'
import { DB } from '@openforis/arena-server'

// db client: connection pool, task or transaction
export type DbClient = BaseProtocol

// typed as a generic client so that functions defaulting their client to it accept tasks and transactions too
export const db: DbClient = DB
