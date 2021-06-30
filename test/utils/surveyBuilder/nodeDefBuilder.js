import * as R from 'ramda'

import * as Survey from '../../../core/survey/survey'
import * as NodeDef from '../../../core/survey/nodeDef'
import * as NodeDefExpression from '../../../core/survey/nodeDefExpression'
import * as NodeDefValidations from '../../../core/survey/nodeDefValidations'

export default class NodeDefBuilder {
  constructor(name, type) {
    this.type = type
    this.props = {
      [NodeDef.propKeys.name]: name,
    }
    this.propsAdvanced = {}
  }

  _setProp(prop, value, advanced = false) {
    const props = advanced ? this.propsAdvanced : this.props
    props[prop] = value
    return this
  }

  _createNodeDef(parentDef) {
    return NodeDef.newNodeDef(parentDef, this.type, [Survey.cycleOneKey], this.props, this.propsAdvanced)
  }

  applyIf(expr) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.applicable,
      [NodeDefExpression.createExpression({ expression: expr })],
      true
    )
  }

  multiple() {
    return this._setProp(NodeDef.propKeys.multiple, true)
  }

  minCount(count) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocMinCount(count))(this),
      true
    )
  }

  maxCount(count) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocMaxCount(count))(this),
      true
    )
  }

  expressions(...expressions) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocExpressions(expressions))(this),
      true
    )
  }
}
