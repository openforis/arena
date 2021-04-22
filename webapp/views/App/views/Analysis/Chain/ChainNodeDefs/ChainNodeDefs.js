import './ChainNodeDefs.scss'
import React from 'react'
import { useDispatch } from 'react-redux'

import { ChainActions, useChainEntityDefUuid } from '@webapp/store/ui/chain'

import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'

const ChainNodeDefs = () => {
  const dispatch = useDispatch()
  const entityDefUuid = useChainEntityDefUuid()

  const selectEntity = (entityDef) => dispatch(ChainActions.updateEntityDefUuid(entityDef.uuid))

  return (
    <div className="chain-node-defs">
      <EntitySelectorTree nodeDefUuidActive={entityDefUuid} onSelect={selectEntity} />
    </div>
  )
}

export { ChainNodeDefs }
