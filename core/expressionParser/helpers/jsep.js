import { Jsep, default as jsep } from 'jsep'

// Add exponentiation operator (right-to-left)
jsep.addBinaryOp('**', 11, true)

class ArenaJsep extends Jsep {
  // extend the gobbleGroup function to always include sequence expressions (expressions enclosed in parenthesis)
  gobbleGroup() {
    this.index++
    let nodes = this.gobbleExpressions(Jsep.CPAREN_CODE)
    if (this.code === Jsep.CPAREN_CODE) {
      this.index++
      if (!nodes.length) {
        // ignore empty sequence expressions
        return false
      }
      // TODO: consider only first node of the sequence?!
      return {
        type: Jsep.SEQUENCE_EXP,
        expression: nodes[0],
      }
    } else {
      this.throwError('Unclosed (')
    }
  }
}

const arenaJsep = (expr) => new ArenaJsep(expr).parse()

export default arenaJsep
