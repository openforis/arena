import * as PromiseUtils from '../../../../core/promiseUtils'
import { getSurveyEntry } from '../../downloads/path'
import { records } from '../../mock/records'
import { cluster, tree } from '../../mock/nodeDefs'
import { formatTime } from '../_record'
import { getNodeDefByName } from './_surveyUtils'

// eslint-disable-next-line camelcase
const { tree_id } = tree.children

const getNodesByDefUuid = (nodeDefUuid) => (record) => {
  const nodeUuids = record._nodesByDef[nodeDefUuid]
  return nodeUuids.map((nodeUuid) => record.nodes[nodeUuid])
}

const getNodeByDefUuid = (nodeDefUuid) => (record) => getNodesByDefUuid(nodeDefUuid)(record)[0]

const verifyCode = async (nodeExport, value) => {
  const { refData } = nodeExport
  const { props } = refData.categoryItem
  await expect(`(${props.code}) ${props.labels.en}`).toBe(value)
}
const verifyCoordinate = async (nodeExport, value) => {
  const { x, y, srs } = nodeExport.value
  await expect(x).toBe(value.x)
  await expect(y).toBe(value.y)
  await expect(srs).toBe(value.srs)
}
// const verifyTaxon = async (nodeExport, value) => {
//   const { refData } = nodeExport
//   await expect(refData.taxon.props.code).toBe(value.code)
//   await expect(refData.taxon.props.scientificName).toBe(value.scientificName)
// }
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
  // TODO: enable verifyTaxon when fixing https://github.com/openforis/arena/issues/1405
  // taxon: verifyTaxon,
  taxon: () => {},
  text: verifyText,
  time: verifyTime,
}

const verifyNode = async (nodeDefExport, nodeExport, value) => {
  const verifyNodeFn = verifyNodeFns[nodeDefExport.type]
  return verifyNodeFn(nodeExport, value)
}

const verifyRecord = async (survey, surveyExport, recordUuid) => {
  const clusterIdDef = cluster.children.cluster_id
  const clusterIdDefExport = getNodeDefByName(clusterIdDef.name)(surveyExport)

  const recordExport = getSurveyEntry(survey, 'records', `${recordUuid}.json`)
  const clusterIdExport = getNodeByDefUuid(clusterIdDefExport.uuid)(recordExport)
  const record = records.find((_record) => _record[clusterIdDef.name] === clusterIdExport.value)

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

export const verifyRecords = (survey) =>
  test('Verify records', async () => {
    const recordsExport = getSurveyEntry(survey, 'records', 'records.json')
    const surveyExport = getSurveyEntry(survey, 'survey.json')

    await expect(recordsExport.length).toBe(records.length)

    await PromiseUtils.each(recordsExport, async (recordExport) =>
      verifyRecord(survey, surveyExport, recordExport.uuid)
    )
  })
