import Job from '@server/job/job'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import SurveyCreatorJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/categoriesImportJob'
import NodeDefsImportJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob'
import * as XForm from '@server/modules/odkImport/service/odkImport/model/xform'

import { getContextUser } from '../config/context'

// ODK `required` binds: a literal is imported as the "required" flag, an XPath expression as a "required if" condition.
const xformXml = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>required_if_test</h:title>
    <model>
      <instance>
        <data id="required_if_test">
          <plot_no/>
          <land_use/>
          <remarks/>
          <meta><instanceID/></meta>
        </data>
      </instance>
      <bind nodeset="/data/plot_no" type="int" required="true()"/>
      <bind nodeset="/data/land_use" type="int"/>
      <bind nodeset="/data/remarks" type="string" required="../land_use = 1"/>
      <bind calculate="concat('uuid:', uuid())" nodeset="/data/meta/instanceID" readonly="true()" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/plot_no"><label>Plot no</label></input>
    <input ref="/data/land_use"><label>Land use</label></input>
    <input ref="/data/remarks"><label>Remarks</label></input>
  </h:body>
</h:html>`

let surveyId: number | null = null

const getValidationsByOdkPath = (survey: any, odkPath: string) => {
  const odkNodeDefsInfoByPath = Survey.getOdkNodeDefsInfoByPath(Survey.getSurveyInfo(survey)) as Record<string, string>
  const nodeDef = Survey.getNodeDefByUuid(odkNodeDefsInfoByPath[odkPath])(survey)
  return NodeDef.getValidations(nodeDef)
}

describe('ODK import - required expressions', () => {
  beforeAll(async () => {
    const user = getContextUser()
    const xform = XForm.parseXForm(xformXml)
    const defaultLanguage = 'en'
    const job = new Job('TestOdkRequiredIfImportJob', { user, xform, languages: [defaultLanguage], defaultLanguage }, [
      new SurveyCreatorJob(),
      new CategoriesImportJob(),
      new NodeDefsImportJob(),
    ])
    await job.start()
    if (!job.isSucceeded()) {
      throw new Error(`schema import failed: ${JSON.stringify(job.errors)}`)
    }
    surveyId = (job as any).context.surveyId
  }, 30000)

  afterAll(async () => {
    if (surveyId) {
      await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
    }
  })

  test('literal required imported as "required", expression as "required if"', async () => {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      draft: true,
      advanced: true,
    })

    const plotNoValidations = getValidationsByOdkPath(survey, '/data/plot_no')
    expect(NodeDefValidations.isRequired(plotNoValidations)).toBe(true)
    expect(NodeDefValidations.isRequiredIfDefined(plotNoValidations)).toBe(false)

    const remarksValidations = getValidationsByOdkPath(survey, '/data/remarks')
    expect(NodeDefValidations.isRequired(remarksValidations)).toBe(false)
    expect(
      NodeDefValidations.getRequiredIf(remarksValidations).map((expr) => NodeDefExpression.getExpression(expr).trim())
    ).toEqual(['land_use == 1'])
  })
})
