import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Record from '@core/record/record'
import * as RecordValidation from '@core/record/recordValidation'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as Validation from '@core/validation/validation'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

import { getContextUser } from '../../integration/config/context'

const { nodeDefType } = NodeDef

// record uploaded from Arena Mobile and merged into the server one, with a validation
// reading an extra prop of the item of a big category code attribute (items not in the survey index)
describe('Records replace updated nodes - big category', () => {
  const buildSurveyAndItems = async (user) => {
    let survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.attribute('plot_id', nodeDefType.code)
          .category('sampling_point')
          .key()
          .expressions(
            NodeDefExpression.createExpression({
              expression: `categoryItemProp('sampling_point', 'lot', this) == contract_lot`,
            })
          ),
        SB.attribute('contract_lot', nodeDefType.text),
        SB.attribute('remarks', nodeDefType.text)
      )
    )
      .categories(
        SB.category('sampling_point').extraProps({
          lot: ExtraPropDef.newItem({ dataType: ExtraPropDef.dataTypes.text }),
        })
      )
      .build()

    const category = Survey.getCategoryByName('sampling_point')(survey)
    survey = Survey.assocCategory(Category.assocItemsCount(Category.maxCategoryItemsInIndex + 1)(category))(survey)
    const levelUuid = Category.getLevelByIndex(0)(category).uuid
    const newItem = (code, lot) =>
      CategoryItem.newItem(levelUuid, null, {
        [CategoryItem.keysProps.code]: code,
        [CategoryItem.keysProps.extra]: { lot },
      })
    // items known only by the categoryItemProvider (fetched from the DB)
    const items = [newItem('1', '4'), newItem('1c', '5')]
    const categoryItemProvider = {
      getItemByUuid: async ({ itemUuid }) => items.find((item) => item.uuid === itemUuid),
      getItemByCodePaths: async ({ codePaths }) =>
        items.find((item) => CategoryItem.getCode(item) === codePaths[codePaths.length - 1]),
    }
    return { survey, items, categoryItemProvider }
  }

  const buildRecord = ({ user, survey, item }) =>
    RB.record(
      user,
      survey,
      RB.entity(
        'plot',
        RB.attribute('plot_id', Node.newNodeValueCode({ itemUuid: item.uuid })),
        RB.attribute('contract_lot', '5'),
        RB.attribute('remarks', 'a')
      )
    ).build()

  // ref data attached to the node, as when the record is fetched from the DB
  const setPlotIdRefData = ({ survey, record, item }) => {
    const plotIdNode = RecordUtils.findNodeByPath('plot/plot_id')(survey, record)
    plotIdNode[NodeRefData.keys.refData] = { [NodeRefData.keys.categoryItem]: item }
  }

  // copy of the target record (same node uuids) with updated values and without ref data, as sent by the device
  const buildSourceRecord = ({ survey, recordTarget, valuesByName }) => {
    const recordSource = JSON.parse(JSON.stringify(recordTarget))
    for (const node of Object.values(recordSource.nodes)) {
      node[NodeRefData.keys.refData] = undefined
      const nodeDefName = NodeDef.getName(Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey))
      if (Object.hasOwn(valuesByName, nodeDefName)) {
        node.value = valuesByName[nodeDefName]
        node.dateModified = new Date(Date.now() + 60000).toISOString()
      }
    }
    return recordSource
  }

  const replaceAndGetPlotIdValidation = async ({ survey, categoryItemProvider, recordSource, recordTarget }) => {
    const { record } = await Record.replaceUpdatedNodes({
      survey,
      categoryItemProvider,
      recordSource,
      sideEffect: true,
    })(recordTarget)
    const plotIdNode = RecordUtils.findNodeByPath('plot/plot_id')(survey, record)
    return RecordValidation.getNodeValidation(plotIdNode)(Validation.getValidation(record))
  }

  it('plot_id is valid after an update not changing it', async () => {
    const user = getContextUser()
    const { survey, items, categoryItemProvider } = await buildSurveyAndItems(user)
    const recordTarget = buildRecord({ user, survey, item: items[1] })
    setPlotIdRefData({ survey, record: recordTarget, item: items[1] })
    const recordSource = buildSourceRecord({ survey, recordTarget, valuesByName: { remarks: 'b', contract_lot: '5' } })

    const validation = await replaceAndGetPlotIdValidation({ survey, categoryItemProvider, recordSource, recordTarget })
    expect(Validation.isValid(validation)).toBe(true)
  })

  it('plot_id is valid after an update changing it (target node with ref data of the previous item)', async () => {
    const user = getContextUser()
    const { survey, items, categoryItemProvider } = await buildSurveyAndItems(user)
    const recordTarget = buildRecord({ user, survey, item: items[0] })
    setPlotIdRefData({ survey, record: recordTarget, item: items[0] })
    const recordSource = buildSourceRecord({
      survey,
      recordTarget,
      valuesByName: { plot_id: Node.newNodeValueCode({ itemUuid: items[1].uuid }) },
    })

    const validation = await replaceAndGetPlotIdValidation({ survey, categoryItemProvider, recordSource, recordTarget })
    expect(Validation.isValid(validation)).toBe(true)
  })
})
