import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as FileUtils from '@server/utils/file/fileUtils'

import ArenaSurveyReaderJob from './metaImportJobs/arenaSurveyReaderJob'
import SurveyCreatorJob from './metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from './metaImportJobs/categoriesImportJob'
import TaxonomiesImportJob from './metaImportJobs/taxonomiesImportJob'
import NodeDefsImportJob from './metaImportJobs/nodeDefsImportJob'
import RecordsImportJob from './metaImportJobs/recordsImportJob'
import UsersImportJob from './metaImportJobs/usersImportJob'
import ChainsImportJob from './metaImportJobs/chainsImportJob'
import CreateRdbJob from './metaImportJobs/createRdb'

export default class ArenaImportJob extends Job {
  constructor(params) {
    super(ArenaImportJob.type, params, [
      new ArenaSurveyReaderJob(),
      new SurveyCreatorJob(),
      new UsersImportJob(),
      new TaxonomiesImportJob(),
      new CategoriesImportJob(),
      new NodeDefsImportJob(),
      new RecordsImportJob(),
      new ChainsImportJob(),
      // Needed when the survey is published
      new CreateRdbJob(),
    ])
  }

  async beforeSuccess() {
    const { surveyId } = this.context

    this.setResult({
      surveyId,
    })
  }

  async onEnd() {
    await super.onEnd()

    const { arenaSurveyFileZip, surveyId, filePath } = this.context

    if (arenaSurveyFileZip) {
      arenaSurveyFileZip.close()
    }

    if (!this.isSucceeded() && surveyId) {
      await SurveyManager.dropSurveySchema(surveyId)
    }

    await FileUtils.rmdir(filePath)
  }
}

ArenaImportJob.type = 'ArenaImportJob'
