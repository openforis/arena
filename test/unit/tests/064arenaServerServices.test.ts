import { ArenaServer, ServerServiceType } from '@openforis/arena-server'

import { SurveyDataMigrationServiceArena } from '@server/modules/survey/service/dataMigration/surveyDataMigrationService'
import { initArenaServerServices } from '@server/system/arenaServerServices'

describe('arena-server services', () => {
  it('the Arena survey data migration service replaces the arena-server default', () => {
    // ArenaServer.initServices registers the arena-server defaults again
    const defaultService = ArenaServer.initServices().getService(ServerServiceType.surveyDataMigration)
    expect(defaultService).not.toBe(SurveyDataMigrationServiceArena)

    const serviceRegistry = initArenaServerServices()
    expect(serviceRegistry.getService(ServerServiceType.surveyDataMigration)).toBe(SurveyDataMigrationServiceArena)
  })
})
