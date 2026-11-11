import type { ServiceRegistry } from '@openforis/arena-core'
import { ArenaServer, ServerServiceType } from '@openforis/arena-server'

import { SurveyDataMigrationServiceArena } from '@server/modules/survey/service/dataMigration/surveyDataMigrationService'

/**
 * Registers the Arena implementations of arena-server services, replacing the arena-server defaults.
 * @param {!ServiceRegistry} serviceRegistry - The service registry.
 * @returns {ServiceRegistry} - The service registry.
 */
export const registerArenaServerServices = (serviceRegistry: ServiceRegistry): ServiceRegistry =>
  serviceRegistry.registerService(ServerServiceType.surveyDataMigration, SurveyDataMigrationServiceArena)

/**
 * Initializes the arena-server services (ArenaServer.initServices registers the arena-server defaults again)
 * and registers the Arena implementations.
 * @returns {ServiceRegistry} - The service registry.
 */
export const initArenaServerServices = (): ServiceRegistry => registerArenaServerServices(ArenaServer.initServices())
