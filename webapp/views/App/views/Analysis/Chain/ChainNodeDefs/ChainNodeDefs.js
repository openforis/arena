import './ChainNodeDefs.scss'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import {
  ChainActions,
  useChain,
  useChainEntityDefUuid,
  useChainNodeDefs,
  useChainNodeDefsCount,
} from '@webapp/store/ui/chain'
import { useI18n } from '@webapp/store/system'

import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'
import { ChainNodeDefsHeader } from './ChainNodeDefsHeader'
import { ChainNodeDef } from './ChainNodeDef'

const ChainNodeDefs = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const entityDefUuid = useChainEntityDefUuid()
  const chainNodeDefsCount = useChainNodeDefsCount()
  const chainNodeDefs = useChainNodeDefs()

  const selectEntity = (entityDef) => dispatch(ChainActions.updateEntityDefUuid(entityDef.uuid))
  const getLabelPostfix = (entityDef) => {
    const count = chainNodeDefsCount[entityDef.uuid]
    return count ? ` (${count})` : ''
  }

  useEffect(() => {
    if (entityDefUuid) {
      dispatch(ChainActions.fetchChainNodeDefs({ chainUuid: chain.uuid, entityDefUuid }))
    }
  }, [chain, entityDefUuid])

  return (
    <div className="chain-node-defs-wrapper">
      <EntitySelectorTree getLabelPostfix={getLabelPostfix} nodeDefUuidActive={entityDefUuid} onSelect={selectEntity} />

      {entityDefUuid && (
        <div className="chain-node-defs">
          <ChainNodeDefsHeader />

          {chainNodeDefs.length > 0 && (
            <div className="chain-node-def list-header">
              <div>{i18n.t('common.name')}</div>
              <div>{i18n.t('common.label')}</div>
              <div>{i18n.t('common.type')}</div>
              <div>{i18n.t('common.active')}</div>
              <div />
            </div>
          )}

          {chainNodeDefs.map((chainNodeDef) => (
            <ChainNodeDef key={chainNodeDef.uuid} chainNodeDef={chainNodeDef} />
          ))}
        </div>
      )}
    </div>
  )
}

export { ChainNodeDefs }
