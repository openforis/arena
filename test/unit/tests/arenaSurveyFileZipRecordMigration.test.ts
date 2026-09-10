import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'

const recordUuid = 'record-uuid'
const rootUuid = 'root-uuid'

const legacyRecord = {
  uuid: recordUuid,
  nodes: {
    [rootUuid]: { uuid: rootUuid, recordUuid, nodeDefUuid: 'cluster-def-uuid', meta: { h: [] } },
  },
}

const migratedRecord = {
  uuid: recordUuid,
  nodes: {
    1: { iId: 1, recordUuid, nodeDefUuid: 'cluster-def-uuid', meta: { h: [] } },
  },
  lastNodeInternalId: 1,
}

const buildFakeZipFile = (content: any): any => ({
  getEntryData: async () => JSON.stringify(content),
})

describe('ArenaSurveyFileZip.getRecord', () => {
  test('migrates a legacy uuid/parentUuid-linked record to the current iId/pIId shape', async () => {
    const record: any = await ArenaSurveyFileZip.getRecord(buildFakeZipFile(legacyRecord), recordUuid)

    expect(record.uuid).toBe(recordUuid)
    expect(record.lastNodeInternalId).toBe(1)
    const [node]: any[] = Object.values(record.nodes)
    expect(node.uuid).toBeUndefined()
    expect(node.iId).toBe(1)
    expect(node.pIId).toBeUndefined()
  })

  test('leaves an already-migrated record unchanged', async () => {
    const record = await ArenaSurveyFileZip.getRecord(buildFakeZipFile(migratedRecord), recordUuid)

    expect(record).toEqual(migratedRecord)
  })

  test('returns null when the record entry is missing from the zip', async () => {
    const zipFile: any = { getEntryData: async () => null }
    const record = await ArenaSurveyFileZip.getRecord(zipFile, recordUuid)

    expect(record).toBeNull()
  })
})
