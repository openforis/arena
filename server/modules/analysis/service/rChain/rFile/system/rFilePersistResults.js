import * as PromiseUtils from '@core/promiseUtils'
import * as ApiRoutes from '@common/apiRoutes'
import * as NodeDef from '@core/survey/nodeDef'

import DfResults from './dfResults'

import { writeCsv, arenaPutFile, zipr } from '../../rFunctions'
import RFilePersistScriptsGeneric from './rFilePersistScriptsGeneric'

const getSendResultsToServerScripts = ({ rChain, entity, dfResults }) => {
  const { chainUuid, surveyId, cycle, dirResults } = rChain
  const { name: dfResultName, dfSourceName } = dfResults
  const scripts = []

  // csv file
  const fileResults = `${dirResults}/${dfSourceName}.csv`
  scripts.push(writeCsv(dfResultName, fileResults))
  // zip file
  const fileZip = `${dirResults}/${dfSourceName}.zip`
  scripts.push(zipr(fileZip, fileResults))
  // put request
  scripts.push(
    arenaPutFile(
      ApiRoutes.rChain.entityData({ surveyId, cycle, chainUuid, entityUuid: NodeDef.getUuid(entity) }),
      fileZip
    )
  )
  return scripts
}

export default class RFilePersistResults extends RFilePersistScriptsGeneric {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }

  async appendPersistScripts() {
    const { entitiesWithActiveQuantitativeVariables } = this.rChain

    await PromiseUtils.each(entitiesWithActiveQuantitativeVariables, async (entity) => {
      const dfResults = new DfResults(this.rChain, entity)

      await this.logInfo(`'Uploading results for entity ${dfResults.dfSourceName} started'`)
      await this.appendContent(...getSendResultsToServerScripts({ rChain: this.rChain, entity, dfResults }))
      await this.logInfo(`'Uploading results for entity ${dfResults.dfSourceName} completed'`)
    })
  }
}
