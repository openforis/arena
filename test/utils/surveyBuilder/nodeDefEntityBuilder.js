import { uuidv4 } from '@core/uuid'
import * as R from 'ramda'

import * as Survey from '../../../core/survey/survey'
import * as NodeDef from '../../../core/survey/nodeDef'
import * as NodeDefLayout from '../../../core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '../../../core/survey/nodeDefLayoutUpdater'

import NodeDefBuilder from './nodeDefBuilder'

export default class NodeDefEntityBuilder extends NodeDefBuilder {
  constructor(name, ...childBuilders) {
    super(name, NodeDef.nodeDefType.entity)
    this.childBuilders = childBuilders
    this._renderType = NodeDefLayout.renderType.form
    this._displayIn = NodeDefLayout.displayIn.parentPage
    this._virtual = false
  }

  renderAsTable() {
    this._renderType = NodeDefLayout.renderType.table
    return this
  }

  displayInOwnPage() {
    this._displayIn = NodeDefLayout.displayIn.ownPage
    return this
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

    // layout props
    let defUpdated = NodeDefLayout.updateLayout((layout) => {
      const layoutCycle = layout[Survey.cycleOneKey] || {}
      const layoutCycleUpdated = {
        ...layoutCycle,
        [NodeDefLayout.keys.renderType]: this._renderType,
        [NodeDefLayout.keys.pageUuid]: this._displayIn === NodeDefLayout.displayIn.ownPage ? uuidv4() : null,
      }
      const layoutUpdated = NodeDefLayout.assocLayoutCycle(Survey.cycleOneKey, layoutCycleUpdated)(layout)
      return layoutUpdated
    })(def)

    const defUuid = NodeDef.getUuid(def)

    const defs = R.pipe(
      R.map((childBuilder) => childBuilder.build(survey, defUpdated)),
      R.mergeAll,
      R.assoc(defUuid, defUpdated)
    )(this.childBuilders)
    const surveyUpdated = Survey.mergeNodeDefs(defs)(survey)

    // update node def layout

    defUpdated = NodeDefLayoutUpdater.initializeParentLayout({
      survey: surveyUpdated,
      cycle: Survey.cycleOneKey,
      nodeDefParent: defUpdated,
    })

    const defsUpdated = { ...defs, [defUuid]: defUpdated }
    return defsUpdated
  }
}
