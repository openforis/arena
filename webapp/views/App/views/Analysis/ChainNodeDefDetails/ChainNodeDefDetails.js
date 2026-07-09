import './ChainNodeDefDetails.scss'

import React from 'react'
import classNames from 'classnames'

import NodeDefDetails from '@webapp/components/survey/NodeDefDetails'
import { useChainEditable } from '@webapp/store/ui/chain'

const ChainNodeDefDetails = () => {
  const editable = useChainEditable()

  return (
    <div className={classNames('chain-node-def-details', { 'chain-node-def-details--locked': !editable })}>
      <NodeDefDetails />
    </div>
  )
}

export default ChainNodeDefDetails
