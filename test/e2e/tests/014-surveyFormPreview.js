import * as NodeDef from '@core/survey/nodeDef'

import { above, click, clickParent, dropDown } from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { expectSurveyFormLoaded } from '../utils/ui/surveyForm'
import { expectSurveyFormHasOnlyAndInOrderThesePages } from '../utils/ui/surveyFormPage'
import { clickHeaderBtnMySurveys } from '../utils/ui/header'
import { NodeDefsUtils } from '../utils/ui/nodeDefs'

const getEnterFunction = ({ type }) => NodeDefsUtils[type].enterValue
const getEnterParams = ({ type, ...values }) => ({ ...values })
const getCheckFunction = ({ type }) => NodeDefsUtils[type].expectValue
const getCheckParams = ({ type, ...values }) => ({ ...values })

const doSequencial = async ({ items, getFunction, getParams }) =>
  items.reduce(async (promise, item) => {
    await promise
    return getFunction(item)(getParams(item))
  }, true)

const enterValuesSequencial = async ({ items }) =>
  doSequencial({ items, getFunction: getEnterFunction, getParams: getEnterParams })

const checkValuesSequencial = async ({ items }) =>
  doSequencial({ items, getFunction: getCheckFunction, getParams: getCheckParams })

const enterValuesCluster = enterValuesSequencial
const enterValuesPlot = async ({ items }) => {
  await click('Plot')
  await click('Add')
  await enterValuesSequencial({ items })
}

const checkValuesCluster = checkValuesSequencial
const checkValuesPlot = async ({ id, items }) => {
  await click('Plot')
  await dropDown({ class: 'node-select' }).select(`Plot id - ${id}`)
  await checkValuesSequencial({ items })
}

const ClusterItems = [
  { type: NodeDef.nodeDefType.integer, value: 1, label: 'Cluster id' },
  { type: NodeDef.nodeDefType.decimal, value: 10, label: 'Cluster decimal' },
  { type: NodeDef.nodeDefType.date, value: '20/11/2020', label: 'Cluster date' },
  { type: NodeDef.nodeDefType.time, value: '10:30', label: 'Cluster time' },
  { type: NodeDef.nodeDefType.boolean, value: 'true', label: 'Cluster boolean' },
  {
    type: NodeDef.nodeDefType.coordinate,
    x: 10,
    y: 15,
    srs: 'GCS WGS 1984 (EPSG:4326)',
    label: 'Cluster coordinate',
  },
]

const countryRelativeSelectors = () => above('Region')
const plots = [
  [
    { type: NodeDef.nodeDefType.integer, value: 1, label: 'Plot id' },
    { type: NodeDef.nodeDefType.text, value: 'text', label: 'Plot text' },

    {
      type: NodeDef.nodeDefType.code,
      value: 'Country',
      label: 'Country',
      relativeSelectors: [countryRelativeSelectors],
    },
    { type: NodeDef.nodeDefType.code, value: 'Region 01', label: 'Region' },
    { type: NodeDef.nodeDefType.code, value: 'District 0102', label: 'Province' },
  ],
  [
    { type: NodeDef.nodeDefType.integer, value: 2, label: 'Plot id' },
    { type: NodeDef.nodeDefType.text, value: 'text', label: 'Plot text' },

    {
      type: NodeDef.nodeDefType.code,
      value: 'Country',
      label: 'Country',
      relativeSelectors: [countryRelativeSelectors],
    },
    { type: NodeDef.nodeDefType.code, value: 'Region 02', label: 'Region' },
    { type: NodeDef.nodeDefType.code, value: 'District 0203', label: 'Province' },
  ],
]

describe('SurveyForm Preview', () => {
  test('Select survey 1', async () => {
    await waitForLoader()
    await clickHeaderBtnMySurveys()
    await clickParent('Survey')

    await waitForLoader()

    await clickSidebarBtnSurveyForm()

    await expectSurveyFormLoaded()

    await expectSurveyFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot'] })
  })

  test('Open preview', async () => {
    await click('Preview')
    await expectSurveyFormHasOnlyAndInOrderThesePages({ pageLabels: ['Cluster', 'Plot'] })
  })

  test('Enter Cluster nodes', async () => enterValuesCluster({ items: ClusterItems }))

  test('Enter Plot 1 values', async () => enterValuesPlot({ items: plots[0] }))

  test('Enter Plot 2 values', async () => enterValuesPlot({ items: plots[1] }))

  test('Check Cluster values', async () => {
    await click('Cluster')
    await checkValuesCluster({ items: ClusterItems })
  })

  test('Check Plot 1 values', async () => checkValuesPlot({ id: 1, items: plots[0] }))

  test('Check Plot 2 values', async () => checkValuesPlot({ id: 2, items: plots[1] }))
})
