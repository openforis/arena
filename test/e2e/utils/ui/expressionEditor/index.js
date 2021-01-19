import { click, waitFor1sec } from '../../api'

import { setBinaryExpression } from './expressionEditorBasic'
import { setAdvancedExpression } from './expressionEditorAdvanced'

export const setExpression = async ({ binaryExpression, expression }) => {
  if (binaryExpression) {
    await setBinaryExpression({ binaryExpression })
  } else {
    await click('Advanced')
    await waitFor1sec()
    await setAdvancedExpression({ expression })
  }
  await click('Apply')
}
