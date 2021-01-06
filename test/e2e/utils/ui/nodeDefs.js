import * as NodeDef from '@core/survey/nodeDef'

import {
  click,
  writeIntoTextBox,
  below,
  toRightOf,
  textBox,
  expectInputTextToBe,
  getElement,
  expectExists,
  within,
  button,
} from '../api'

const enterNodeDefValueBase = async ({ value, label }) => writeIntoTextBox({ text: value, selector: below(label) })

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
      await writeIntoTextBox({ text: x, selector: toRightOf('X', below(label)) })
      await writeIntoTextBox({ text: y, selector: toRightOf('Y', below(label)) })

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
