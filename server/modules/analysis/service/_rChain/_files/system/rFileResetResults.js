import * as ResultView from '@common/analysis/resultView'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeAnalysisTable from '@common/surveyRdb/nodeAnalysisTable'

import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import { dbSendQuery } from '@server/modules/analysis/service/_rChain/rFunctions'

import * as DbRepository from '@server/db/repository/dbRepository'
import * as MaterializedView from '@server/db/model/materializedView'

export default class RFileResetResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'reset-results')
  }

  async init() {
    await super.init()

    const chainUuid = this.rChain.chainUuid
    const query = dbSendQuery(
      `delete from ${NodeAnalysisTable.tableName} where ${NodeAnalysisTable.colNames.processingChainUuid} = '${chainUuid}'`,
    )
    await this.appendContent(query)

    const viewNamesPrexif = ResultView.getViewNamesPrefix(chainUuid)
    const views = await DbRepository.fetchMaterializedViewsBySchema(SchemaRdb.getName(this.rChain.surveyId))

    for (const view of views) {
      const viewName = MaterializedView.getViewName(view)
      if (viewName.startsWith(viewNamesPrexif)) {
        const dropView = dbSendQuery(`DROP MATERIALIZED VIEW IF EXISTS \\"${viewName}\\"`)
        await this.appendContent(dropView)
      }
    }

    return this
  }
}
