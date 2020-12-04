import {
  click,
  clickParent,
  writeIntoTextBox,
  below,
  toRightOf,
  textBox,
  expectInputTextToBe,
  dropDown,
} from '../utils/api'
import { waitForLoader } from '../utils/ui/loader'
import { clickSidebarBtnSurveyForm } from '../utils/ui/sidebar'
import { expectSurveyFormLoaded } from '../utils/ui/surveyForm'
import { expectSurveyFormHasOnlyAndInOrderThesePages } from '../utils/ui/surveyFormPage'
import { clickHeaderBtnMySurveys } from '../utils/ui/header'

const enterNodeDefText = async ({ value, label }) => writeIntoTextBox({ text: value, selector: below(label) })
const enterNodeDefInteger = async ({ value, label }) => writeIntoTextBox({ text: value, selector: below(label) })
const enterNodeDefDecimal = async ({ value, label }) => writeIntoTextBox({ text: value, selector: below(label) })
const enterNodeDefDate = async ({ value, label }) => writeIntoTextBox({ text: value, selector: below(label) })
const enterNodeDefTime = async ({ value, label }) => writeIntoTextBox({ text: value, selector: below(label) })

const enterNodeDefCode = async ({ label, value }) => {
  await click(textBox(below(label)))
  await click(value, below(textBox(below(label))))
}
const enterNodeDefCoordinate = async ({ x, y, srs, label }) => {
  await writeIntoTextBox({ text: x, selector: toRightOf('X', below(label)) })
  await writeIntoTextBox({ text: y, selector: toRightOf('Y', below(label)) })

  await click(textBox(toRightOf('SRS', below(label))))
  await click(srs)
}

const expectNodeDefBase = async ({ value: text, label }) =>
  expectInputTextToBe({ text: String(text), selector: below(label) })

const expectNodeDefText = expectNodeDefBase
const expectNodeDefInteger = expectNodeDefBase
const expectNodeDefDecimal = expectNodeDefBase
const expectNodeDefDate = expectNodeDefBase
const expectNodeDefTime = expectNodeDefBase

const expectNodeDefCode = expectNodeDefBase

const expectNodeDefCoordinate = async ({ x, y, srs, label }) => {
  await expectInputTextToBe({ text: String(x), selector: toRightOf('X', below(label)) })
  await expectInputTextToBe({ text: String(y), selector: toRightOf('Y', below(label)) })
  await expectInputTextToBe({
    text: srs,
    selector: toRightOf('SRS', below(label)),
  })
}

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

  test('Enter Cluster nodes', async () => {
    await enterNodeDefInteger({ value: 1, label: 'Cluster id' })
    await enterNodeDefDecimal({ value: 10, label: 'Cluster decimal' })
    await enterNodeDefDate({ value: '20/11/2020', label: 'Cluster date' })
    await enterNodeDefTime({ value: '10:30', label: 'Cluster time' })

    await click('true', below('Cluster boolean'))

    await enterNodeDefCoordinate({ x: 10, y: 10, srs: 'GCS WGS 1984 (EPSG:4326)', label: 'Cluster coordinate' })
  })

  test('Enter Plot 1 nodes', async () => {
    await click('Plot')
    await click('Add')

    await enterNodeDefInteger({ value: 1, label: 'Plot id' })
    await enterNodeDefText({ value: 'text', label: 'Plot text' })

    await enterNodeDefCode({ value: 'Country', label: 'Country' })
    await enterNodeDefCode({ value: 'Region 01', label: 'Region' })
    await enterNodeDefCode({ value: 'District 0102', label: 'Province' })
  })

  test('Enter Plot 2 nodes', async () => {
    await click('Add')

    await enterNodeDefInteger({ value: 2, label: 'Plot id' })
    await enterNodeDefText({ value: 'text', label: 'Plot text' })

    await enterNodeDefCode({ value: 'Country', label: 'Country' })
    await enterNodeDefCode({ value: 'Region 02', label: 'Region' })
    await enterNodeDefCode({ value: 'District 0203', label: 'Province' })
  })

  test('Check Cluster values', async () => {
    await click('Cluster')

    await expectNodeDefInteger({ value: 1, label: 'Cluster id' })
    await expectNodeDefDecimal({ value: 10, label: 'Cluster decimal' })
    await expectNodeDefDate({ value: '20/11/2020', label: 'Cluster date' })
    await expectNodeDefTime({ value: '10:30', label: 'Cluster time' })

    await expectNodeDefCoordinate({ x: 10, y: 10, srs: 'GCS WGS 1984 (EPSG:4326)', label: 'Cluster coordinate' })
  })

  test('Check Plot 1 values', async () => {
    await click('Plot')

    await dropDown({ class: 'node-select' }).select('Plot id - 1')

    await expectNodeDefInteger({ value: 1, label: 'Plot id' })
    await expectNodeDefText({ value: 'text', label: 'Plot text' })

    await expectNodeDefCode({ value: 'Country', label: 'Country' })
    await expectNodeDefCode({ value: 'Region 01', label: 'Region' })
    await expectNodeDefCode({ value: 'District 0102', label: 'Province' })
  })

  test('Check Plot 2 values', async () => {
    await dropDown({ class: 'node-select' }).select('Plot id - 2')

    await expectNodeDefInteger({ value: 2, label: 'Plot id' })
    await expectNodeDefText({ value: 'text', label: 'Plot text' })

    await expectNodeDefCode({ value: 'Country', label: 'Country' })
    await expectNodeDefCode({ value: 'Region 02', label: 'Region' })
    await expectNodeDefCode({ value: 'District 0203', label: 'Province' })
  })
})
