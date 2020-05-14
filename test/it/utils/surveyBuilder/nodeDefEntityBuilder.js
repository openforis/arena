import * as R from 'ramda'

import * as NodeDef from '../../../../core/survey/nodeDef'

import NodeDefBuilder from './nodeDefBuilder'

export default class NodeDefEntityBuilder extends NodeDefBuilder {
  constructor(name, ...childBuilders) {
    super(name, NodeDef.nodeDefType.entity)
    this.childBuilders = childBuilders
    this._virtual = false
  }

  virtual() {
    this._virtual = true
    return this
  }

  build(survey, parentDef = null) {
    const def = this._createNodeDef(parentDef)
    if (this._virtual) {
      def[NodeDef.keys.virtual] = true
      def[NodeDef.keys.analysis] = true
    }

    return R.pipe(
      R.map((childBuilder) => childBuilder.build(survey, def)),
      R.mergeAll,
      R.assoc(NodeDef.getUuid(def), def)
    )(this.childBuilders)
  }
}
