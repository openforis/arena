import AdmZip from 'adm-zip'

import { ArenaServer } from '@openforis/arena-server'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import SurveyExportJob from '@server/modules/survey/service/surveyExport/surveyExportJob'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../config/context'

// node def names are used as SQL identifiers and in file names: names with other characters are never stored

const nameInvalidKey = Validation.messageKeys.nodeDefEdit.nameInvalid
const nameWithSql = 'x"; DROP TABLE survey; --'

let survey: any = null
const createdSurveyIds: number[] = []

const fetchNodeDefNames = async (surveyId: number): Promise<string[]> => {
  const surveyDraft = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })
  return Survey.getNodeDefsArray(surveyDraft)
    .map((nodeDef: any) => NodeDef.getName(nodeDef))
    .sort()
}

const createBackupWithNodeDefName = async ({ nodeDefName, newName }: { nodeDefName: string; newName: string }) => {
  const exportJob: any = new SurveyExportJob({ surveyId: Survey.getId(survey), user: getContextUser(), backup: true })
  await exportJob.start()
  if (!exportJob.isSucceeded()) throw new Error('survey export failed')

  const zip = new AdmZip(exportJob.context.filePath)
  const surveyJson = JSON.parse(zip.readFile(ExportFile.survey).toString('utf8'))
  const nodeDef: any = Object.values(surveyJson.nodeDefs).find(
    (def: any) => (def.propsDraft?.name ?? def.props?.name) === nodeDefName
  )
  nodeDef.props = { ...nodeDef.props, name: newName }
  nodeDef.propsDraft = { ...nodeDef.propsDraft, name: newName }
  zip.addFile(ExportFile.survey, Buffer.from(JSON.stringify(surveyJson)))
  const filePath = FileUtils.newTempFilePath()
  zip.writeZip(filePath)
  return filePath
}

describe('Node def names check on write', () => {
  beforeAll(async () => {
    // services used by SurveyExportJob (see 013surveyFilesExportImportTest)
    ArenaServer.initServices()

    survey = await SB.survey(
      getContextUser(),
      SB.entity('cluster', SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key())
    ).buildAndStore()
    createdSurveyIds.push(Survey.getId(survey))
  })

  afterAll(async () => {
    for (const surveyId of createdSurveyIds) {
      await SurveyManager.deleteSurvey(surveyId)
    }
  })

  test('names with characters not allowed are not saved', async () => {
    const user = getContextUser()
    const surveyId = Survey.getId(survey)
    const clusterDef = Survey.getNodeDefByName('cluster')(survey)
    const clusterNoDef = Survey.getNodeDefByName('cluster_no')(survey)

    const nodeDefNew = NodeDef.newNodeDef(clusterDef, NodeDef.nodeDefType.text, [Survey.cycleOneKey], {
      [NodeDef.propKeys.name]: nameWithSql,
    })
    await expect(NodeDefManager.insertNodeDef({ user, survey, nodeDef: nodeDefNew })).rejects.toThrow(nameInvalidKey)

    const updateName = (name: string) =>
      NodeDefManager.updateNodeDefProps({
        user,
        survey,
        nodeDefUuid: NodeDef.getUuid(clusterNoDef),
        parentUuid: NodeDef.getUuid(clusterDef),
        props: { [NodeDef.propKeys.name]: name },
      })
    await expect(updateName('../../cluster')).rejects.toThrow(nameInvalidKey)
    // names still being typed (e.g. starting with a number) are saved: the survey validation reports them
    await updateName('1st')
    expect(await fetchNodeDefNames(surveyId)).toEqual(['1st', 'cluster'])
    await updateName('cluster_no')
  })

  test('an Arena backup with node def names not allowed is not imported', async () => {
    const filePath = await createBackupWithNodeDefName({ nodeDefName: 'cluster_no', newName: nameWithSql })
    const job: any = new ArenaImportJob({ user: getContextUser(), filePath })
    await job.start()
    if (job.result?.surveyId) {
      createdSurveyIds.push(job.result.surveyId)
    }
    expect(job.isSucceeded()).toBe(false)
    expect(JSON.stringify(job.errors)).toContain(nameInvalidKey)

    // the temporary survey is deleted once the job transaction has ended
    const temporarySurveyId = job.context.surveyId
    expect(temporarySurveyId).toBeDefined()
    let surveyIdFound = temporarySurveyId
    for (let attempt = 0; attempt < 20 && surveyIdFound; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      surveyIdFound = await db.oneOrNone(
        'SELECT id FROM survey WHERE id = $1',
        [temporarySurveyId],
        (row) => row?.id ?? null
      )
    }
    expect(surveyIdFound).toBeNull()
  })
})
