import FileZip from '@server/utils/file/fileZip'

import Job from '@server/job/job'

import * as ArenaSurveyFileZip from '../model/arenaSurveyFileZip'

/**
 * Reads the schema from a Arena backup file and saves it into the job context under idmlSource property.
 */
export default class ArenaSurveyReaderJob extends Job {
  constructor(params) {
    super('ArenaSurveyReaderJob', params)
  }

  async execute() {
    const filePath = this.getContextProp('filePath')
    const arenaSurveyFileZip = new FileZip(filePath)
    await arenaSurveyFileZip.init()

    const arenaSurvey = await ArenaSurveyFileZip.getSurvey(arenaSurveyFileZip)

    this.setContext({ arenaSurveyFileZip, arenaSurvey })
  }
}

/*
AAA [
  'survey_survey/survey.json',
    'survey_survey/categories/categories.json',
    'survey_survey/categories/17bd3dae-9277-4b63-9998-eb8c6afeac5a.json',
    'survey_survey/taxonomies/taxonomies.json',
    'survey_survey/taxonomies/ab18b350-3b52-4c3a-affc-5c2d932102d8.json',
    'survey_survey/records/records.json',
    'survey_survey/records/063e3918-3b40-48fb-acde-d32c8be341f5.json',
    'survey_survey/records/a52ffff7-9d94-41b4-859a-73170e696857.json',
    'survey_survey/records/eae3ea0a-2995-4927-8060-30f24e395c54.json',
    'survey_survey/records/d19018f1-0a59-4102-bdd5-81f75a20702f.json',
    'survey_survey/records/0e18e753-95d2-4eaf-9d31-abe5a3bc416d.json',
    'survey_survey/chains/chains.json',
    'survey_survey/chains/a7ed8803-22c9-4da3-adb2-5bf961ea5d8d.json'
  ]
*/
