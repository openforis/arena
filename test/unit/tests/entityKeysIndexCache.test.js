import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'

import { getContextUser } from '../../integration/config/context'

let survey = {}
let record = {}

const getNodeDef = (path) => SurveyUtils.getNodeDefByPath({ survey, path })
const getItemUuid = (codesPath) =>
  SurveyUtils.getCategoryItemUuid({ survey, categoryName: 'hierarchical_category', codesPath })

// plots are identified by a code attribute; items with the same code (1) exist under different parent items (1 and 2)
const findPlot = ({ plotCodeValue, entityKeysIndexCache = null }) =>
  Record.findChildByKeyValues({
    survey,
    parentNode: Record.getRootNode(record),
    childDefUuid: getNodeDef('cluster/plot').uuid,
    keyValuesByDefUuid: { [getNodeDef('cluster/plot/plot_code').uuid]: plotCodeValue },
    entityKeysIndexCache,
  })(record)

const getPlotCodeValue = (plot) =>
  Node.getValue(Record.getNodeChildByDefUuid(plot, getNodeDef('cluster/plot/plot_code').uuid)(record))

describe('EntityKeysIndexCache (code keys)', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_code', NodeDef.nodeDefType.code).category('hierarchical_category').key()
        ).multiple()
      )
    )
      .categories(
        SB.category('hierarchical_category')
          .levels('level_1', 'level_2')
          .items(
            SB.categoryItem('1').items(SB.categoryItem('1')),
            SB.categoryItem('2').items(SB.categoryItem('1')),
            SB.categoryItem('3')
          )
      )
      .build()

    record = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 1),
        RB.entity('plot', RB.attribute('plot_code', Node.newNodeValueCode({ itemUuid: getItemUuid(['1', '1']) }))),
        RB.entity('plot', RB.attribute('plot_code', Node.newNodeValueCode({ itemUuid: getItemUuid(['2', '1']) })))
      )
    ).build()
  }, 10000)

  it('finds entities with code keys by category item', () => {
    const entityKeysIndexCache = new Record.EntityKeysIndexCache()
    for (const codesPath of [
      ['1', '1'],
      ['2', '1'],
    ]) {
      const itemUuid = getItemUuid(codesPath)
      const plotCodeValue = Node.newNodeValueCode({ itemUuid, code: '1' })
      const plotFound = findPlot({ plotCodeValue, entityKeysIndexCache })
      // same code, different category items: the right entity must be found
      expect(getPlotCodeValue(plotFound)).toEqual(expect.objectContaining({ [Node.valuePropsCode.itemUuid]: itemUuid }))
      expect(plotFound).toStrictEqual(findPlot({ plotCodeValue }))
    }
    const notExistingItemValue = Node.newNodeValueCode({ itemUuid: getItemUuid(['3']) })
    expect(findPlot({ plotCodeValue: notExistingItemValue, entityKeysIndexCache })).toBeUndefined()
  })

  it('finds entities comparing all the siblings when the searched code value has no category item', () => {
    const entityKeysIndexCache = new Record.EntityKeysIndexCache()
    const plotCodeValue = Node.newNodeValueCode({ code: '1' })
    expect(findPlot({ plotCodeValue, entityKeysIndexCache })).toStrictEqual(findPlot({ plotCodeValue }))
  })

  it('finds entities comparing all the siblings when a sibling code value has no category item', () => {
    const user = getContextUser()
    const recordPrev = record
    // plot with code value without category item uuid: its item can be determined only using the record
    record = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 1),
        RB.entity('plot', RB.attribute('plot_code', Node.newNodeValueCode({ itemUuid: getItemUuid(['1', '1']) }))),
        RB.entity('plot', RB.attribute('plot_code', Node.newNodeValueCode({ code: '3' })))
      )
    ).build()
    try {
      const entityKeysIndexCache = new Record.EntityKeysIndexCache()
      const plotCodeValue = Node.newNodeValueCode({ itemUuid: getItemUuid(['3']) })
      const plotFound = findPlot({ plotCodeValue, entityKeysIndexCache })
      expect(plotFound).toBeDefined()
      expect(getPlotCodeValue(plotFound)).toEqual(expect.objectContaining({ [Node.valuePropsCode.code]: '3' }))
      expect(plotFound).toStrictEqual(findPlot({ plotCodeValue }))
    } finally {
      record = recordPrev
    }
  })
})
