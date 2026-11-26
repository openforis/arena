import type { ServiceRegistry } from '@openforis/arena-core'
import { ArenaServer, ServerServiceType } from '@openforis/arena-server'

import { SurveyDataMigrationServiceArena } from '@server/modules/survey/service/dataMigration/surveyDataMigrationService'

/**
 * Registers the Arena implementations of arena-server services, replacing the arena-server defaults.
 */
export const registerArenaServerServices = (serviceRegistry: ServiceRegistry): ServiceRegistry =>
  serviceRegistry.registerService(ServerServiceType.surveyDataMigration, SurveyDataMigrationServiceArena)

/**
 * Initializes the arena-server services (ArenaServer.initServices registers the arena-server defaults again)
 * and registers the Arena implementations.
 */
export const initArenaServerServices = (): ServiceRegistry => registerArenaServerServices(ArenaServer.initServices())
