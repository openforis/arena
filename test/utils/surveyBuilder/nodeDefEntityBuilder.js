import { uuidv4 } from '@core/uuid'
import * as A from '@core/arena'

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
    let defUpdated = NodeDef.updateLayout((layout) => {
      const layoutCycle = layout[Survey.cycleOneKey] || {}
      const layoutCycleUpdated = {
        ...layoutCycle,
        [NodeDefLayout.keys.renderType]: this._renderType,
        [NodeDefLayout.keys.pageUuid]: this._displayIn === NodeDefLayout.displayIn.ownPage ? uuidv4() : null,
      }
      return NodeDefLayout.assocLayoutCycle(Survey.cycleOneKey, layoutCycleUpdated)(layout)
    })(def)

    const defUuid = NodeDef.getUuid(def)

    const defs = A.pipe(
      A.map((childBuilder) => childBuilder.build(survey, defUpdated)),
      A.mergeAll,
      A.assoc(defUuid, defUpdated)
    )(this.childBuilders)

    const findChildDef = (name) =>
      Object.values(defs).find((d) => NodeDef.getParentUuid(d) === defUuid && NodeDef.getName(d) === name)
    const getChildBuilderName = (childBuilder) => childBuilder.props[NodeDef.propKeys.name]

    // resolve parent code attributes (siblings, available only now that all the children have been built)
    this.childBuilders.forEach((childBuilder) => {
      const { parentCodeDefName } = childBuilder
      if (!parentCodeDefName) return
      const childDef = findChildDef(getChildBuilderName(childBuilder))
      childDef.props[NodeDef.propKeys.parentCodeDefUuid] = NodeDef.getUuid(findChildDef(parentCodeDefName))
    })

    let surveyUpdated = Survey.mergeNodeDefs(defs)(survey)

    // update node def layout

    defUpdated = NodeDefLayoutUpdater.initializeParentLayout({
      survey: surveyUpdated,
      cycle: Survey.cycleOneKey,
      nodeDefParent: defUpdated,
    })
    surveyUpdated = Survey.mergeNodeDefs({ [defUuid]: defUpdated })(surveyUpdated)

    // add every child to this entity layout (grid layout, table columns or child pages), like the form designer does
    this.childBuilders.forEach((childBuilder) => {
      const childDef = findChildDef(getChildBuilderName(childBuilder))
      const { layoutInParent } = childBuilder
      const defWithChildLayout = NodeDefLayoutUpdater.updateParentLayout({
        survey: surveyUpdated,
        nodeDef: childDef,
        cyclesAdded: [Survey.cycleOneKey],
        layoutInParentByCycle: layoutInParent ? { [Survey.cycleOneKey]: layoutInParent } : null,
      })
      if (defWithChildLayout) {
        defUpdated = defWithChildLayout
        surveyUpdated = Survey.mergeNodeDefs({ [defUuid]: defUpdated })(surveyUpdated)
      }
    })

    const defsUpdated = { ...defs, [defUuid]: defUpdated }
    return defsUpdated
  }
}
