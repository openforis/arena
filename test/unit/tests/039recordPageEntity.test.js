import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import {
  getMultiplePageScopeEntityUuid,
  getPageEntity,
  hasUnresolvedMultipleAncestor,
} from '@webapp/store/ui/record/recordPageEntity'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as DataTest from '../../utils/dataTest'

import { getContextUser } from '../../integration/config/context'

let survey = {}
let record = {}

const getNodeDef = (path) => SurveyUtils.getNodeDefByPath({ survey, path })
const getNode = (path) => RecordUtils.findNodeByPath(path)(survey, record)

describe('recordPageEntity', () => {
  beforeAll(async () => {
    const user = getContextUser()
    survey = await DataTest.createTestSurvey({ user })
    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  test('resolves single root entity without pagesUuidMap', () => {
    const clusterDef = getNodeDef('cluster')
    const cluster = getNode('cluster')

    const resolved = getPageEntity({
      survey,
      record,
      pageNodeDefUuid: NodeDef.getUuid(clusterDef),
    })

    expect(Node.getUuid(resolved)).toBe(Node.getUuid(cluster))
  })

  test('never guesses first instance for a multiple page entity', () => {
    const plotDef = getNodeDef('cluster/plot')
    const plot1 = getNode('cluster/plot[0]')

    const resolved = getPageEntity({
      survey,
      record,
      pageNodeDefUuid: NodeDef.getUuid(plotDef),
    })

    expect(resolved).toBeNull()
    expect(plot1).toBeTruthy()
  })

  test('resolves multiple page entity from pagesUuidMap', () => {
    const plotDef = getNodeDef('cluster/plot')
    const plot2 = getNode('cluster/plot[1]')

    const resolved = getPageEntity({
      survey,
      record,
      pagesUuidMap: { [NodeDef.getUuid(plotDef)]: Node.getUuid(plot2) },
      pageNodeDefUuid: NodeDef.getUuid(plotDef),
    })

    expect(Node.getUuid(resolved)).toBe(Node.getUuid(plot2))
  })

  test('resolves nested single entity under selected multiple parent', () => {
    const plotDef = getNodeDef('cluster/plot')
    const plotDetailsDef = getNodeDef('cluster/plot/plot_details')
    const plot1 = getNode('cluster/plot[0]')
    const plotDetails1 = getNode('cluster/plot[0]/plot_details')

    const resolved = getPageEntity({
      survey,
      record,
      pagesUuidMap: { [NodeDef.getUuid(plotDef)]: Node.getUuid(plot1) },
      pageNodeDefUuid: NodeDef.getUuid(plotDetailsDef),
    })

    expect(Node.getUuid(resolved)).toBe(Node.getUuid(plotDetails1))
  })

  test('does not resolve nested entity when multiple parent is unselected', () => {
    const plotDetailsDef = getNodeDef('cluster/plot/plot_details')

    const resolved = getPageEntity({
      survey,
      record,
      pagesUuidMap: {},
      pageNodeDefUuid: NodeDef.getUuid(plotDetailsDef),
    })

    expect(resolved).toBeNull()
  })

  test('hasUnresolvedMultipleAncestor is true without parent selection', () => {
    const plotDetailsDef = getNodeDef('cluster/plot/plot_details')

    expect(hasUnresolvedMultipleAncestor(plotDetailsDef, survey, {})).toBe(true)
  })

  test('hasUnresolvedMultipleAncestor is false when parent is selected', () => {
    const plotDef = getNodeDef('cluster/plot')
    const plotDetailsDef = getNodeDef('cluster/plot/plot_details')
    const plot1 = getNode('cluster/plot[0]')

    expect(
      hasUnresolvedMultipleAncestor(plotDetailsDef, survey, {
        [NodeDef.getUuid(plotDef)]: Node.getUuid(plot1),
      })
    ).toBe(false)
  })

  test('getMultiplePageScopeEntityUuid scopes nested multiple to selected parent', () => {
    const plotDef = getNodeDef('cluster/plot')
    const treeDef = getNodeDef('cluster/plot/tree')
    const plot2 = getNode('cluster/plot[1]')

    const scopeUuid = getMultiplePageScopeEntityUuid({
      survey,
      record,
      pagesUuidMap: { [NodeDef.getUuid(plotDef)]: Node.getUuid(plot2) },
      pageNodeDef: treeDef,
    })

    expect(scopeUuid).toBe(Node.getUuid(plot2))
  })

  test('getMultiplePageScopeEntityUuid returns null when parent is unselected', () => {
    const treeDef = getNodeDef('cluster/plot/tree')

    const scopeUuid = getMultiplePageScopeEntityUuid({
      survey,
      record,
      pagesUuidMap: {},
      pageNodeDef: treeDef,
    })

    expect(scopeUuid).toBeNull()
  })
})
