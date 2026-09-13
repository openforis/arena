import Job from '@server/job/job'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'

import SurveyCreatorJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/surveyCreatorJob'
import CategoriesImportJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/categoriesImportJob'
import NodeDefsImportJob from '@server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob'
import RecordsImportJob from '@server/modules/odkImport/service/odkImport/dataImportJobs/recordsImportJob'
import * as XForm from '@server/modules/odkImport/service/odkImport/model/xform'
import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'

import { getContextUser } from '../config/context'

import { transportationXml } from '@test/unit/tests/resources/transportationXform'
import {
  transportationSubmission1Xml,
  transportationSubmission2NoResponseXml,
  transportationSubmission3Xml,
} from '@test/unit/tests/resources/transportationSubmissions'

// End-to-end test of the real ODK import pipeline (no mocks/stand-ins for the survey/record data) run
// directly against the real form + real ODK Collect submissions in resources/transportation* (sourced
// from onaio/onadata's own test suite - see those files for provenance). Runs the same Job classes
// production wires together (OdkImportJob / OdkDataImportJob), just composed here directly instead of
// through the file-upload-driven PrepareImportFileJob/OdkFormReaderJob/OdkSubmissionReaderJob steps,
// since the fixtures are already in-memory strings rather than an uploaded .xml/.zip file.
//
// transportation1.xml's instance root is named "transportation" (an older revision of the real form,
// itself renamed "data" in later revisions - see transportationXform.ts) and has no <itext> block, so
// languages/defaultLanguage are derived the same way OdkFormReaderJob does, just inlined here.

const submission1Uuid = 'f3d8dc65-91a6-4d0f-9e97-802128083390'
const submission3Uuid = 'f3d8dc65-91a6-4d0f-9e97-802128083392'

const submissionEntryNamesByXml: Record<string, string> = {
  'transport_2011-07-25_19-05-36/submission.xml': transportationSubmission1Xml,
  'transport_no_response/submission.xml': transportationSubmission2NoResponseXml,
  'transport_2011-07-25_19-05-52/submission.xml': transportationSubmission3Xml,
}

// Minimal stand-in for OdkSubmissionReaderJob's FileZip - RecordsImportJob only ever calls
// getEntryAsText (submission bodies) and getEntryData (media file bytes, never exercised here since
// this form has no upload/binary attribute) and close().
const submissionFileZip = {
  getEntryAsText: (entryName: string) => submissionEntryNamesByXml[entryName],
  getEntryData: () => null,
  close: () => {},
}

let surveyId: number | null = null
let odkNodeDefsInfoByPath: Record<string, string> = {}

const getNodeDefUuidByOdkPath = (odkPath: string): string => {
  const nodeDefUuid = odkNodeDefsInfoByPath[odkPath]
  if (!nodeDefUuid) throw new Error(`no node def imported for ODK path ${odkPath}`)
  return nodeDefUuid
}

const fetchCodeItemUuidByCode = async ({
  survey,
  nodeDefUuid,
  code,
}: {
  survey: any
  nodeDefUuid: string
  code: string
}) => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const item = await CategoryItemProviderDefault.getItemByCode({ survey, categoryUuid, code, draft: true })
  return item ? item.uuid : null
}

describe('ODK import pipeline - real form + real submissions (onaio/onadata)', () => {
  beforeAll(async () => {
    const user = getContextUser()

    const xform = XForm.parseXForm(transportationXml)
    // Same derivation OdkFormReaderJob does for a form with no <itext> block at all (this one has none).
    const defaultLanguage = 'en'
    const languages = [defaultLanguage]

    // Mirrors OdkImportJob's real inner-job chain (minus PrepareImportFileJob/OdkFormReaderJob, which
    // exist only to turn an uploaded file into `xform`/`languages`/`defaultLanguage` - already have
    // those in-memory here). SurveyDependencyGraphsGenerationJob + SurveyRdbCreationJob are NOT optional
    // extras: RecordsImportJob (run further down) queries the RDB data view to check for pre-existing
    // records, so it fails outright ("relation ... does not exist") without them having run first.
    const schemaImportJob = new Job('TestOdkSchemaImportJob', { user, xform, languages, defaultLanguage }, [
      new SurveyCreatorJob(),
      new CategoriesImportJob(),
      new NodeDefsImportJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new SurveyRdbCreationJob(),
    ])
    await schemaImportJob.start()

    if (!schemaImportJob.isSucceeded()) {
      throw new Error(`schema import failed: ${JSON.stringify(schemaImportJob.errors)}`)
    }

    const schemaContext: any = (schemaImportJob as any).context
    surveyId = schemaContext.surveyId
    // Mirrors SurveyCreatorJobHelper.onJobEnd (called from OdkImportJob.onEnd in production): a survey
    // inserted via SurveyCreatorJob starts out flagged "temporary" until its owning job succeeds.
    await SurveyManager.removeSurveyTemporaryFlag({ surveyId })

    const surveyAfterSchemaImport = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      draft: true,
      advanced: true,
    })
    odkNodeDefsInfoByPath = Survey.getOdkNodeDefsInfoByPath(Survey.getSurveyInfo(surveyAfterSchemaImport)) as Record<
      string,
      string
    >

    const recordsImportJob = new RecordsImportJob({
      user,
      surveyId,
      submissionFileZip,
      submissionEntryNames: Object.keys(submissionEntryNamesByXml),
    })
    await recordsImportJob.start()

    if (!recordsImportJob.isSucceeded()) {
      throw new Error(`records import failed: ${JSON.stringify(recordsImportJob.errors)}`)
    }
  }, 30000)

  afterAll(async () => {
    if (surveyId) {
      await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: false })
    }
  })

  test('imports the real form schema (node defs for every real path, temporary flag cleared)', async () => {
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true })
    expect(Survey.getProps(Survey.getSurveyInfo(survey)).temporary).toBeFalsy()

    // Real paths from the actual form, including the doubly-nested "loop" group structure and the
    // real name-collision the importer's dedup logic has to resolve (every one of the 10 transport
    // types repeats a "frequency_to_referral_facility" leaf name under its own group).
    expect(getNodeDefUuidByOdkPath('/transportation')).toBeTruthy()
    expect(
      getNodeDefUuidByOdkPath('/transportation/transport/available_transportation_types_to_referral_facility')
    ).toBeTruthy()
    expect(
      getNodeDefUuidByOdkPath(
        '/transportation/transport/loop_over_transport_types_frequency/ambulance/frequency_to_referral_facility'
      )
    ).toBeTruthy()
    expect(
      getNodeDefUuidByOdkPath(
        '/transportation/transport/loop_over_transport_types_frequency/bicycle/frequency_to_referral_facility'
      )
    ).toBeTruthy()
  })

  test('creates one record per well-formed real submission, with the real multi-select and nested select1 answers', async () => {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      draft: true,
      advanced: true,
    })

    const multiSelectDefUuid = getNodeDefUuidByOdkPath(
      '/transportation/transport/available_transportation_types_to_referral_facility'
    )
    const ambulanceFrequencyDefUuid = getNodeDefUuidByOdkPath(
      '/transportation/transport/loop_over_transport_types_frequency/ambulance/frequency_to_referral_facility'
    )
    const bicycleFrequencyDefUuid = getNodeDefUuidByOdkPath(
      '/transportation/transport/loop_over_transport_types_frequency/bicycle/frequency_to_referral_facility'
    )

    const ambulanceItemUuid = await fetchCodeItemUuidByCode({
      survey,
      nodeDefUuid: multiSelectDefUuid,
      code: 'ambulance',
    })
    const bicycleItemUuid = await fetchCodeItemUuidByCode({ survey, nodeDefUuid: multiSelectDefUuid, code: 'bicycle' })
    const dailyItemUuid = await fetchCodeItemUuidByCode({
      survey,
      nodeDefUuid: ambulanceFrequencyDefUuid,
      code: 'daily',
    })
    const weeklyItemUuid = await fetchCodeItemUuidByCode({
      survey,
      nodeDefUuid: bicycleFrequencyDefUuid,
      code: 'weekly',
    })

    for (const recordUuid of [submission1Uuid, submission3Uuid]) {
      const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid, draft: true })
      expect(record).not.toBeNull()

      // real multi-select answer "ambulance bicycle" -> one sibling node per selected code, each
      // resolved to the real category item inserted from the form's own static <item> choices
      const multiSelectNodes = Record.getNodesByDefUuid(multiSelectDefUuid)(record)
      const selectedItemUuids = multiSelectNodes.map((node: any) => Node.getCategoryItemUuid(node)).sort()
      expect(selectedItemUuids).toEqual([ambulanceItemUuid, bicycleItemUuid].sort())

      // real nested select1 answers ("daily" for ambulance, "weekly" for bicycle), 3 levels deep
      const ambulanceFrequencyNode = Record.getNodesByDefUuid(ambulanceFrequencyDefUuid)(record)[0]
      expect(Node.getCategoryItemUuid(ambulanceFrequencyNode)).toBe(dailyItemUuid)

      const bicycleFrequencyNode = Record.getNodesByDefUuid(bicycleFrequencyDefUuid)(record)[0]
      expect(Node.getCategoryItemUuid(bicycleFrequencyNode)).toBe(weeklyItemUuid)
    }

    // submission1 and submission3 are near-duplicates (same answers, different real instanceID) -
    // distinct records, neither overwriting the other
    expect(submission1Uuid).not.toBe(submission3Uuid)
  })

  test('handles a real submission with a missing multi-select answer and a malformed (non-uuid) instanceID', async () => {
    // transport_no_response.xml's own <meta><instanceID> ("uuid:7g0a1508-...") contains a 'g', so it is
    // not a valid uuid - extractInstanceUuid rejects it and RecordsImportJob falls back to generating a
    // fresh one, so this submission can only be found by scanning all records rather than by a known uuid.
    const { list: allRecordsSummary } = await RecordManager.fetchRecordsSummaryBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      includeRootKeyValues: true,
    })
    // 3 submissions in, none skipped as duplicates (all 3 real instanceIDs/generated uuids are distinct)
    expect(allRecordsSummary).toHaveLength(3)

    const noResponseRecordUuid = allRecordsSummary
      .map((summary: any) => Record.getUuid(summary))
      .find((uuid: string) => uuid !== submission1Uuid && uuid !== submission3Uuid)
    expect(noResponseRecordUuid).toBeTruthy()

    const record = await RecordManager.fetchRecordAndNodesByUuid({
      surveyId,
      recordUuid: noResponseRecordUuid,
      draft: true,
    })
    const multiSelectDefUuid = getNodeDefUuidByOdkPath(
      '/transportation/transport/available_transportation_types_to_referral_facility'
    )
    // the field was missing from the submission entirely (not just empty) - no value node at all,
    // never guessed at
    expect(Record.getNodesByDefUuid(multiSelectDefUuid)(record)).toHaveLength(0)
  })
})
