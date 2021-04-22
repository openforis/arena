import './ChainNodeDefs.scss'
import React from 'react'

import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'

const ChainNodeDefs = () => {
  return (
    <div className="chain-node-defs">
      <EntitySelectorTree nodeDefUuidActive={null} onSelect={() => {}} />
    </div>
  )
}

export { ChainNodeDefs }
