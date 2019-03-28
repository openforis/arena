import React from 'react'
import * as R from 'ramda'

import Survey from '../../../../../common/survey/survey'
import NodeDef from '../../../../../common/survey/nodeDef'

import { nbsp } from '../../../../../common/stringUtils'

import Dropdown from '../../../../commonComponents/form/dropdown'

const getEntities = (hierarchy, lang) => {
  const entities = []

  const traverse = (nodeDef, depth) => {
    const label = NodeDef.getLabel(nodeDef, lang)
    entities.push({
      key: NodeDef.getUuid(nodeDef),
      value: nbsp + R.repeat(nbsp + nbsp, depth).join('') + label
    })
  }
  Survey.traverseHierarchyItemSync(hierarchy.root, traverse)

  return entities
}

const EntitySelector = (props) => {
  const { hierarchy, nodeDefUuidEntity, lang, onChange } = props

  const entities = getEntities(hierarchy, lang)
  const selection = entities.find(R.propEq('key', nodeDefUuidEntity))

  return (
    <Dropdown className="node-defs-selector__entity-selector"
              autocompleteDialogClassName="node-defs-selector__entity-selector-dialog"
              items={entities}
              selection={selection}
              onChange={
                item => onChange(R.prop('key', item))
              }
    />
  )
}

export default EntitySelector