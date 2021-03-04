import { writeIntoEl, waitFor } from '../../api'

const selectors = {
  advancedExpressionInput: () => '.CodeMirror',
}

export const setAdvancedExpression = async ({ expression }) => {
  await waitFor(3000)
  await writeIntoEl({ text: expression, selector: selectors.advancedExpressionInput() })
}
