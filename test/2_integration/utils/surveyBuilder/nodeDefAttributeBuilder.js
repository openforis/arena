import * as R from 'ramda'

import * as NodeDef from '../../../../core/survey/nodeDef'
import * as NodeDefValidations from '../../../../core/survey/nodeDefValidations'

import NodeDefBuilder from './nodeDefBuilder'

export default class NodeDefAttributeBuilder extends NodeDefBuilder {
  constructor(name, type = NodeDef.nodeDefType.text) {
    super(name, type)
    this._analysis = false
  }

  key() {
    return this._setProp(NodeDef.propKeys.key, true)
  }

  readOnly() {
    return this._setProp(NodeDef.propKeys.readOnly, true)
  }

  defaultValues(...defaultValues) {
    return this._setProp(NodeDef.keysPropsAdvanced.defaultValues, defaultValues, true)
  }

  required(required = true) {
    return this._setProp(
      NodeDef.keysPropsAdvanced.validations,
      R.pipe(NodeDef.getValidations, NodeDefValidations.assocRequired(required))(this),
      true
    )
  }

  analysis() {
    this._analysis = true
    return this
  }

  build(survey, parentDef = null) {
    const def = this._createNodeDef(parentDef)
    def[NodeDef.keys.analysis] = this._analysis

    return {
      [NodeDef.getUuid(def)]: def,
    }
  }
}
