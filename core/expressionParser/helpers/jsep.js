import jsep from 'jsep'
import { types } from './types'

// Add exponentiation operator (right-to-left)
jsep.addBinaryOp('**', 11, true)

const OPEN_PARENTHESIS_CODE = 40 // (
const CLOSE_PARENTHESIS_CODE = 41 // )

// keep sequence expressions in parsed expression, even when there is only one node inside of it
// (by default the unnecessary enclosing parenthesis of a sequence expression are omitted, but this won't work in the basic expression editor)
const sequenceExpressionPlugin = {
  name: 'sequence expression plugin',
  init(jsep) {
    jsep.hooks.add('gobble-token', (env) => {
      const { context } = env
      // token starts with ( and it's not a call to a function
      if (!jsep.isIdentifierStart(context.code) && context.code === OPEN_PARENTHESIS_CODE) {
        context.index += 1
        const nodes = context.gobbleExpressions(CLOSE_PARENTHESIS_CODE)
        if (context.code === CLOSE_PARENTHESIS_CODE) {
          context.index += 1
          if (nodes.length > 0) {
            env.node = {
              type: types.SequenceExpression,
              expression: nodes[0],
            }
          }
        } else {
          context.throwError('Unclosed (')
        }
      }
    })
  },
}

jsep.plugins.register(sequenceExpressionPlugin)

export default jsep
