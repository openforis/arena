import { Schemata, TableNode } from '@common/model/db'
import { Query } from '@common/model/query'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { db } from '@server/db/db'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as NodeRepository from '@server/modules/record/repository/nodeRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import { replaceNodeHierarchyDisaggregatedViewIfExists } from '@server/modules/surveyRdb/repository/nodeHierarchyDisaggregatedViewRepository'
import * as NodeHierarchyDisaggregatedView from '@server/modules/surveyRdb/schemaRdb/nodeHierarchyDisaggregatedView'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'
import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../config/context'

// The node meta hierarchy (ancestor uuids) is not stored in the db: it's rebuilt from the parent uuids when reading the nodes.
describe('Node meta hierarchy not stored', () => {
  let survey: any = null
  let record: any = null

  const getSurveyId = () => Survey.getId(survey)
  const getDefUuid = (name: string) => NodeDef.getUuid(Survey.getNodeDefByName(name)(survey))
  const findNode = (path: string) => RecordUtils.findNodeByPath(path)(survey, record)

  // expected hierarchy, computed from the parent uuids of the nodes of the record in memory
  const getExpectedHierarchy = (node: any): string[] => {
    const hierarchy: string[] = []
    let parentUuid = Node.getParentUuid(node)
    while (parentUuid) {
      hierarchy.unshift(parentUuid)
      parentUuid = Node.getParentUuid(Record.getNodeByUuid(parentUuid)(record))
    }
    return hierarchy
  }

  beforeAll(async () => {
    const user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_no', NodeDef.nodeDefType.integer).key(),
          SB.entity('plot_details', SB.attribute('slope', NodeDef.nodeDefType.integer)),
          SB.entity('tree', SB.attribute('tree_no', NodeDef.nodeDefType.integer).key()).multiple()
        ).multiple()
      )
    ).buildAndStore()

    record = await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_no', 1),
        RB.entity(
          'plot',
          RB.attribute('plot_no', 1),
          RB.entity('plot_details', RB.attribute('slope', 10)),
          RB.entity('tree', RB.attribute('tree_no', 1)),
          RB.entity('tree', RB.attribute('tree_no', 2))
        ),
        RB.entity('plot', RB.attribute('plot_no', 2), RB.entity('plot_details', RB.attribute('slope', 20)))
      )
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(getSurveyId())
  })

  test('the hierarchy is not stored in the node meta', async () => {
    const { count } = await db.one(
      `SELECT COUNT(*) FROM ${Schemata.getSchemaSurvey(getSurveyId())}.node WHERE meta ? '${Node.metaKeys.hierarchy}'`
    )
    expect(Number(count)).toBe(0)
  })

  test('the hierarchy of the nodes of a fetched record is rebuilt', async () => {
    const recordFetched = await RecordManager.fetchRecordAndNodesByUuid({
      surveyId: getSurveyId(),
      recordUuid: Record.getUuid(record),
    })
    const nodes = Record.getNodesArray(recordFetched)
    expect(nodes.length).toBe(Record.getNodesArray(record).length)
    for (const node of nodes) {
      expect(Node.getHierarchy(node)).toEqual(getExpectedHierarchy(node))
    }
  })

  test('the hierarchy of a node fetched by uuid is computed in the query', async () => {
    const treeNo = findNode('cluster/plot[0]/tree[1]/tree_no')
    const nodeFetched = await NodeRepository.fetchNodeByUuid(getSurveyId(), Node.getUuid(treeNo))
    expect(Node.getHierarchy(nodeFetched)).toEqual(getExpectedHierarchy(treeNo))
    expect(Node.getHierarchy(nodeFetched)).toHaveLength(3)
  })

  test('the RDB node hierarchy view returns the ancestors of the nodes', async () => {
    const surveyId = getSurveyId()
    // replace the view as done by the survey data migration
    await replaceNodeHierarchyDisaggregatedViewIfExists({ surveyId })
    const treeNo = findNode('cluster/plot[0]/tree[1]/tree_no')
    const { columns } = NodeHierarchyDisaggregatedView
    const ancestorUuids = await db.map(
      `SELECT ${columns.nodeAncestorUuid} FROM ${NodeHierarchyDisaggregatedView.getNameWithSchema(surveyId)}
      WHERE ${columns.nodeUuid} = $1`,
      [Node.getUuid(treeNo)],
      (row) => row[columns.nodeAncestorUuid]
    )
    const sortUuids = (uuids: string[]) => [...uuids].sort((uuidA, uuidB) => uuidA.localeCompare(uuidB))
    expect(sortUuids(ancestorUuids)).toEqual(sortUuids(getExpectedHierarchy(treeNo)))
  })

  test('the RDB data tables are populated with the values of the attributes in single entities', async () => {
    const surveyId = getSurveyId()
    const job = new SurveyRdbCreationJob({ surveyId, user: getContextUser() })
    await job.start()
    expect(job.isSucceeded()).toBe(true)

    // the survey has only one record
    const rows = await db.any(`SELECT plot_no, slope FROM ${SchemaRdb.getName(surveyId)}.data_plot ORDER BY plot_no`)
    expect(rows.map((row) => [Number(row.plot_no), Number(row.slope)])).toEqual([
      [1, 10],
      [2, 20],
    ])
    const treeParentUuids = await db.map(
      `SELECT parent_uuid FROM ${SchemaRdb.getName(surveyId)}.data_tree`,
      [],
      (row) => row.parent_uuid
    )
    expect(treeParentUuids).toEqual([
      Node.getUuid(findNode('cluster/plot[0]')),
      Node.getUuid(findNode('cluster/plot[0]')),
    ])
  })

  test('the node of an attribute in a single entity is selected by the uuid of its ancestor multiple entity', async () => {
    const tableNode = new TableNode(survey)
    const plot = findNode('cluster/plot[1]')
    const nodes = await db.map(
      tableNode.getSelect({ parentUuid: Node.getUuid(plot), nodeDefUuid: getDefUuid('slope') }),
      [],
      TableNode.dbTransformCallback
    )
    expect(nodes.map((node: any) => Node.getValue(node))).toEqual([20])
  })

  test('the data explorer in edit mode returns the nodes of the attributes in single entities', async () => {
    const query = Query.assocMode(Query.modes.rawEdit)(
      Query.create({ entityDefUuid: getDefUuid('plot'), attributeDefUuids: [getDefUuid('slope')] })
    )
    const rows = await SurveyRdbManager.fetchViewData({ survey, cycle: Survey.cycleOneKey, query })
    const slopeDefUuid = getDefUuid('slope')
    const slopeValues = rows
      .map((row) => Node.getValue(row.cols[slopeDefUuid].node))
      .sort((valueA, valueB) => valueA - valueB)
    expect(slopeValues).toEqual([10, 20])
  })
})
