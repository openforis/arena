import * as PromiseUtils from '../../../../core/promiseUtils'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../paths'
import { records } from '../../mock/records'
import { cluster, tree } from '../../mock/nodeDefs'
import { formatTime } from '../_record'
import { getNodeDefByName } from './_surveyUtils'

// eslint-disable-next-line camelcase
const { tree_id } = tree.children

const getNodesByDefUuid = (nodeDefUuid) => (record) =>
  Object.values(record.nodes).filter((node) => node.nodeDefUuid === nodeDefUuid)

const getNodeByDefUuid = (nodeDefUuid) => (record) => getNodesByDefUuid(nodeDefUuid)(record)[0]

const verifyCode = async (nodeExport, _value) => {
  const { value } = nodeExport
  await expect(value).not.toBeNull()
  const { itemUuid } = value
  await expect(itemUuid).not.toBeNull()
  // TODO check that category item code is equal to the specified value
  //await expect(`(${props.code}) ${props.labels.en}`).toBe(value)
}
const verifyCoordinate = async (nodeExport, value) => {
  const { x, y, srs } = nodeExport.value
  await expect(Number(x)).toBe(Number(value.x))
  await expect(Number(y)).toBe(Number(value.y))
  await expect(srs).toBe(value.srs)
}
const verifyTaxon = async (nodeExport, _value) => {
  const { value } = nodeExport
  await expect(value).not.toBeNull()
  const { taxonUuid } = value
  await expect(taxonUuid).not.toBeNull()
  // TODO check that taxon code and scientific name are equal to the ones in the specified value
  // await expect(refData.taxon.props.code).toBe(value.code)
  // await expect(refData.taxon.props.scientificName).toBe(value.scientificName)
}
const verifyText = async (nodeExport, value) => expect(nodeExport.value).toBe(value)
const verifyBoolean = async (nodeExport, value) => verifyText(nodeExport, String(value))
const verifyTime = async (nodeExport, value) => verifyText(nodeExport, formatTime(value))

const verifyNodeFns = {
  boolean: verifyBoolean,
  code: verifyCode,
  coordinate: verifyCoordinate,
  // date: verifyText,
  decimal: verifyText,
  integer: verifyText,

  taxon: verifyTaxon,
  text: verifyText,
  time: verifyTime,
}

const verifyNode = async (nodeDefExport, nodeExport, value) => {
  const verifyNodeFn = verifyNodeFns[nodeDefExport.type]
  return verifyNodeFn(nodeExport, value)
}

const verifyRecord = async (survey, surveyExport, recordsMock, recordUuid) => {
  const clusterIdDef = cluster.children.cluster_id
  const clusterIdDefExport = getNodeDefByName(clusterIdDef.name)(surveyExport)

  const recordExport = getSurveyEntry(survey, ExportFile.record({ recordUuid }))
  const clusterIdExport = getNodeByDefUuid(clusterIdDefExport.uuid)(recordExport)
  const record = recordsMock.find((_record) => _record[clusterIdDef.name] === clusterIdExport.value)

  await expect(recordExport.uuid).toBe(recordUuid)
  await expect(recordExport.preview).toBeFalsy()
  await expect(recordExport.step).toBe('1')
  await expect(recordExport.cycle).toBe('0')

  await PromiseUtils.each(Object.entries(record), async ([name, value]) => {
    if (name === 'trees') {
      // const treeDefExport = getNodeDefByName(tree.name)(surveyExport)
      const treeIdDefExport = getNodeDefByName(tree_id.name)(surveyExport)
      const treeIdsExport = getNodesByDefUuid(treeIdDefExport.uuid)(recordExport)
      await PromiseUtils.each(value, async (treeNode) => {
        const treeId = treeNode[tree_id.name]
        const treeIdExport = treeIdsExport.find((_nodeExport) => _nodeExport.value === treeId)
        await verifyNode(treeIdDefExport, treeIdExport, treeId)
        // const treeExport = recordExport.nodes[treeIdExport.parentUuid]

        await PromiseUtils.each(Object.entries(treeNode), async ([treeChildName, treeChildValue]) => {
          const nodeDefExport = getNodeDefByName(treeChildName)(surveyExport)
          const nodeExport = getNodesByDefUuid(nodeDefExport.uuid)(recordExport).find(
            (_node) => _node.parentUuid === treeIdExport.parentUuid
          )
          await verifyNode(nodeDefExport, nodeExport, treeChildValue)
        })
      })
    } else {
      const nodeDefExport = getNodeDefByName(name)(surveyExport)
      const nodeExport = getNodeByDefUuid(nodeDefExport.uuid)(recordExport)
      await verifyNode(nodeDefExport, nodeExport, value)
    }
  })
}

export const verifyRecords = (survey, recordsMock = records) =>
  test('Verify records', async () => {
    const recordsExport = getSurveyEntry(survey, ExportFile.records)
    const surveyExport = getSurveyEntry(survey, ExportFile.survey)

    await expect(recordsExport.length).toBe(recordsMock.length)

    await PromiseUtils.each(recordsExport, async (recordExport) =>
      verifyRecord(survey, surveyExport, recordsMock, recordExport.uuid)
    )
  })
