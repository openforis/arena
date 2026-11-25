import type { NodeDefType } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '../../../core/survey/nodeDef'
import * as NodeDefExpression from '../../../core/survey/nodeDefExpression'
import * as NodeDefValidations from '../../../core/survey/nodeDefValidations'
import * as Survey from '../../../core/survey/survey'

export default class NodeDefBuilder {
  type: NodeDefType
  props: Record<string, any>
  propsAdvanced: Record<string, any>
  // size in the parent entity form layout (grid layout)
  layoutInParent: { w?: number; h?: number }

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

  prop(key, value) {
    return this._setProp(key, value)
  }

  label(label, lang = 'en') {
    return this._setProp(NodeDef.propKeys.labels, { ...this.props[NodeDef.propKeys.labels], [lang]: label })
  }

  /**
   * Sets the size of the node def in the parent entity form layout (grid layout).
   * @param {object} size - Size.
   * @param {number} [size.w] - Width (number of grid columns).
   * @param {number} [size.h] - Height (number of grid rows).
   * @returns {NodeDefBuilder} - This builder.
   */
  layoutSize({ w, h }) {
    this.layoutInParent = { w, h }
    return this
  }

  propAdvanced(key, value) {
    return this._setProp(key, value, true)
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
      A.pipe(NodeDef.getValidations, NodeDefValidations.assocMinCount(count))(this),
      true
    )
  }

  maxCount(count) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.validations,
      A.pipe(NodeDef.getValidations, NodeDefValidations.assocMaxCount(count))(this),
      true
    )
  }

  expressions(...expressions) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.validations,
      A.pipe(NodeDef.getValidations, NodeDefValidations.assocExpressions(expressions))(this),
      true
    )
  }
}
