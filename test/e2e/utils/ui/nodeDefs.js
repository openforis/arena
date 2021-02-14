import * as NodeDef from '@core/survey/nodeDef'

import * as PromiseUtils from '@core/promiseUtils'
import * as StringUtils from '@core/stringUtils'

import {
  click,
  writeIntoTextBox,
  below,
  toRightOf,
  textBox,
  expectInputTextToBe,
  getElement,
  within,
  button,
  waitFor,
  dropDown,
  expectExists,
  expectNotExists,
  near,
  pressEsc,
  waitFor1sec,
  clearTextBox,
} from '../api'

const enterNodeDefValueBase = async ({ value, label }) => {
  await waitFor(3000)
  const selector = below(label)
  if (StringUtils.isNotBlank(value)) {
    await writeIntoTextBox({ text: value, selector, clearBefore: true })
  } else {
    await clearTextBox({ selector })
  }
}

const expectNodeDefBase = async ({ value: text, label, relativeSelectors = [] }) =>
  expectInputTextToBe({
    text: String(text),
    selector: below(label),
    relativeSelectors: relativeSelectors.map((selector) => selector()),
  })

const NodeDefBase = {
  enterValue: enterNodeDefValueBase,
  expectValue: expectNodeDefBase,
}
export const NodeDefsUtils = {
  [NodeDef.nodeDefType.text]: {
    ...NodeDefBase,
  },
  [NodeDef.nodeDefType.integer]: {
    ...NodeDefBase,
  },
  [NodeDef.nodeDefType.decimal]: {
    ...NodeDefBase,
  },
  [NodeDef.nodeDefType.date]: {
    ...NodeDefBase,
    enterValue: async ({ value, label }) => {
      const [year, month, day] = value.split('-')
      await writeIntoTextBox({
        text: day,
        selector: { class: 'input-day' },
        relativeSelectors: [below(label)],
        clearBefore: true,
      })
      await writeIntoTextBox({
        text: month,
        selector: { class: 'input-month' },
        relativeSelectors: [below(label)],
        clearBefore: true,
      })
      await writeIntoTextBox({
        text: year,
        selector: { class: 'input-year' },
        relativeSelectors: [below(label)],
        clearBefore: true,
      })
      // close calendar
      await pressEsc()
    },
    expectValue: async ({ value, label }) => {
      const [year, month, day] = value.split('-')
      await expectInputTextToBe({ text: day, selector: { class: 'input-day' }, relativeSelectors: [below(label)] })
      await expectInputTextToBe({ text: month, selector: { class: 'input-month' }, relativeSelectors: [below(label)] })
      await expectInputTextToBe({ text: year, selector: { class: 'input-year' }, relativeSelectors: [below(label)] })
    },
  },
  [NodeDef.nodeDefType.time]: {
    ...NodeDefBase,
  },
  [NodeDef.nodeDefType.boolean]: {
    ...NodeDefBase,
    enterValue: async ({ value, label }) => click(value, below(label)),
    expectValue: async ({ value, label }) =>
      expectExists({
        selector: '.icon-radio-checked2',
        relativeSelectors: [
          within(
            button(value),
            within(
              getElement({ selector: '.survey-form__node-def-boolean' }),

              below(label)
            )
          ),
        ],
      }),
  },
  [NodeDef.nodeDefType.code]: {
    ...NodeDefBase,
    enterValue: async ({ label, value }) => {
      await click(textBox(below(label)))
      await click(value, below(textBox(below(label))))
    },
  },
  [NodeDef.nodeDefType.coordinate]: {
    ...NodeDefBase,
    enterValue: async ({ x, y, srs, label }) => {
      await writeIntoTextBox({ text: x, selector: toRightOf('X', below(label)), clearBefore: true })
      await writeIntoTextBox({ text: y, selector: toRightOf('Y', below(label)), clearBefore: true })

      await click(textBox(toRightOf('SRS', below(label))))
      await click(srs)
    },
    expectValue: async ({ x, y, srs, label }) => {
      await expectInputTextToBe({ text: String(x), selector: toRightOf('X', below(label)) })
      await expectInputTextToBe({ text: String(y), selector: toRightOf('Y', below(label)) })
      await expectInputTextToBe({
        text: srs,
        selector: toRightOf('SRS', below(label)),
      })
    },
  },
}

const getEnterFunction = ({ type }) => NodeDefsUtils[type].enterValue
const getEnterParams = ({ type, ...values }) => ({ ...values })
const getCheckFunction = ({ type }) => NodeDefsUtils[type].expectValue
const getCheckParams = ({ type, ...values }) => ({ ...values })

const doSequential = async ({ items, getFunction, getParams }) =>
  items.reduce(async (promise, item) => {
    await promise
    return getFunction(item)(getParams(item))
  }, true)

export const enterValuesSequential = async ({ items }) => {
  await doSequential({ items, getFunction: getEnterFunction, getParams: getEnterParams })
  // wait for relevance/validation feedback
  await waitFor1sec()
}

const checkValuesSequential = async ({ items }) =>
  doSequential({ items, getFunction: getCheckFunction, getParams: getCheckParams })

export const enterValuesCluster = enterValuesSequential
export const enterValuesPlot = async ({ items }) => {
  await click('Plot')
  await waitFor(500)
  await click('Add')
  await waitFor(500)
  await enterValuesSequential({ items })
}

export const checkValuesCluster = checkValuesSequential

export const navigateToPlotForm = async ({ plotId = null } = {}) => {
  await click('Plot')
  await waitFor(500)
  if (plotId) {
    await dropDown({ class: 'node-select' }).select(`Plot id - ${plotId}`)
  } else {
    await dropDown({ class: 'node-select' }).select(`Plot id -`)
  }
  await waitFor(500)
}

export const checkValuesPlot = async ({ id, items }) => {
  await navigateToPlotForm({ plotId: id })
  await checkValuesSequential({ items })
}

export const insertRecord = async (record) => {
  await click('New')
  await waitFor(500)
  const { cluster, plots } = record
  await enterValuesCluster({ items: cluster })
  await PromiseUtils.each(plots, async (plot) => enterValuesPlot({ items: plot }))
}

export const checkRecord = async (record, position) => {
  const { cluster, plots } = record
  await click(await getElement({ selector: `.table__row:nth-child(${position})` }))
  await waitFor(500)
  await checkValuesCluster({ items: cluster })
  await PromiseUtils.each(plots, async (plot, idx) => checkValuesPlot({ id: idx, items: plot }))
}

export const expectIsRelevant = async ({ label }) =>
  expectNotExists({ selector: '.not-applicable', relativeSelectors: [near(label)] })

export const expectIsNotRelevant = async ({ label }) =>
  expectExists({ selector: '.not-applicable', relativeSelectors: [near(label)] })

export const expectIsValid = async ({ label }) =>
  expectNotExists({ selector: '.error', relativeSelectors: [near(label)] })

export const expectIsInvalid = async ({ label }) =>
  expectExists({ selector: '.error', relativeSelectors: [near(label)] })
