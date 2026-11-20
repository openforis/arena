import Job from '@server/job/job'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import SurveyCreatorJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/categoriesImportJob'
import NodeDefsImportJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob'
import * as XForm from '@server/modules/odkImport/service/odkImport/model/xform'

import { transportationXml } from '../../unit/tests/resources/transportationXform'
import { getContextUser } from '../config/context'

// Node defs of imported ODK forms must not block the survey publishing: valid names (also for long duplicate
// names) and no read-only attributes without default values (calculations that could not be converted).
const longName = 'available_transportation_types_to_referral_facility'
const xformXml = `<?xml version="1.0"?>
<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml" xmlns:jr="http://openrosa.org/javarosa">
  <h:head>
    <h:title>publishable_test</h:title>
    <model>
      <instance>
        <data id="publishable_test">
          <plot_no/>
          <land_use/>
          <land_use_copy/>
          <land_use_text/>
          <_7/>
          <${longName}/>
          <visits jr:template="">
            <${longName}/>
            <${longName}/>
          </visits>
          <meta><instanceID/></meta>
        </data>
      </instance>
      <bind nodeset="/data/plot_no" type="int" required="true()"/>
      <bind nodeset="/data/land_use" type="string"/>
      <bind nodeset="/data/land_use_copy" type="string" calculate="../land_use"/>
      <bind nodeset="/data/land_use_text" type="string" calculate="if(../land_use = '1', 'forest', 'other')"/>
      <bind nodeset="/data/_7" type="string"/>
      <bind nodeset="/data/${longName}" type="string"/>
      <bind nodeset="/data/visits/${longName}" type="string"/>
      <bind calculate="concat('uuid:', uuid())" nodeset="/data/meta/instanceID" readonly="true()" type="string"/>
    </model>
  </h:head>
  <h:body>
    <input ref="/data/plot_no"><label>Plot no</label></input>
    <input ref="/data/land_use"><label>Land use</label></input>
    <input ref="/data/_7"><label>Seven</label></input>
    <input ref="/data/${longName}"><label>Transportation types</label></input>
    <repeat nodeset="/data/visits">
      <input ref="/data/visits/${longName}"><label>Transportation types (visit)</label></input>
    </repeat>
  </h:body>
</h:html>`

const validNameRegex = /^[a-z][a-z0-9_]{0,39}$/

const surveyIds: number[] = []

const importXForm = async (xml: string): Promise<any> => {
  const user = getContextUser()
  const xform = XForm.parseXForm(xml)
  const defaultLanguage = 'en'
  const job = new Job('TestOdkPublishableImportJob', { user, xform, languages: [defaultLanguage], defaultLanguage }, [
    new SurveyCreatorJob(),
    new CategoriesImportJob(),
    new NodeDefsImportJob(),
  ])
  await job.start()
  if (!job.isSucceeded()) {
    throw new Error(`schema import failed: ${JSON.stringify(job.errors)}`)
  }
  const surveyId = (job as any).context.surveyId
  surveyIds.push(surveyId)
  return SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle: Survey.cycleOneKey,
    draft: true,
    advanced: true,
  })
}

const getNodeDefByOdkPath = (survey: any, odkPath: string) => {
  const odkNodeDefsInfoByPath = Survey.getOdkNodeDefsInfoByPath(Survey.getSurveyInfo(survey)) as Record<string, string>
  return Survey.getNodeDefByUuid(odkNodeDefsInfoByPath[odkPath])(survey)
}

const expectNodeDefsPublishable = (survey: any) => {
  const nodeDefs = Survey.getNodeDefsArray(survey)
  const names = nodeDefs.map(NodeDef.getName)
  for (const name of names) {
    expect(name).toMatch(validNameRegex)
  }
  expect(new Set(names).size).toBe(names.length)

  const readOnlyWithoutDefaultValues = nodeDefs.filter(
    (nodeDef) => NodeDef.isReadOnly(nodeDef) && NodeDef.getDefaultValues(nodeDef).length === 0
  )
  expect(readOnlyWithoutDefaultValues.map(NodeDef.getName)).toEqual([])
}

describe('ODK import - publishable node defs', () => {
  afterAll(async () => {
    for (const surveyId of surveyIds) {
      await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
    }
  })

  test('valid unique names and no read-only attributes without default values', async () => {
    const survey = await importXForm(xformXml)

    expectNodeDefsPublishable(survey)

    // converted calculation: read-only, with the converted expression as default value
    const landUseCopy = getNodeDefByOdkPath(survey, '/data/land_use_copy')
    expect(NodeDef.isReadOnly(landUseCopy)).toBe(true)
    expect(NodeDef.getDefaultValues(landUseCopy).length).toBe(1)

    // calculation that cannot be converted (if()): left editable
    const landUseText = getNodeDefByOdkPath(survey, '/data/land_use_text')
    expect(NodeDef.isReadOnly(landUseText)).toBe(false)

    // name starting with an underscore
    expect(NodeDef.getName(getNodeDefByOdkPath(survey, '/data/_7'))).toBe('n__7')
  }, 30000)

  test('real form (transportation) with long duplicate names', async () => {
    const survey = await importXForm(transportationXml)

    expect(Survey.getNodeDefsArray(survey).length).toBeGreaterThan(0)
    expectNodeDefsPublishable(survey)
  }, 30000)
})
