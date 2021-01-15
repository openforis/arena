import { writeIntoEl } from '../../api'

const selectors = {
  advancedExpressionInput: () => '.CodeMirror',
}

export const setAdvancedExpression = async ({ expression }) => {
  await writeIntoEl({ text: expression, selector: selectors.advancedExpressionInput() })
}
