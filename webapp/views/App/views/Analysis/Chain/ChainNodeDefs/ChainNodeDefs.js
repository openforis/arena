import './ChainNodeDefs.scss'
import React, { useRef } from 'react'
import { useDispatch } from 'react-redux'
import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'
import { ChainActions, useChainEntityDefUuid } from '@webapp/store/ui/chain'
import { useI18n } from '@webapp/store/system'

import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'
import { useChain } from '@webapp/store/ui/chain'

import { ChainNodeDefsHeader } from './ChainNodeDefsHeader'
import { ChainNodeDef } from './ChainNodeDef'
import { useSortChainNodeDefs } from './hooks'

const ChainNodeDefs = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const entityDefUuid = useChainEntityDefUuid()

  const chain = useChain()

  const chainNodeDefs = Chain.getChainNodeDefs(chain)

  const chainNodeDefsRef = useRef(null)

  const selectEntity = (entityDef) => dispatch(ChainActions.updateEntityDefUuid(entityDef.uuid))
  const getLabelSuffix = (entityDef) => {
    const count = (Chain.getChainNodeDefsInEntity({ entity: entityDef })(chain) || []).length
    return count ? ` (${count})` : ''
  }

  useSortChainNodeDefs({ chainNodeDefsRef })

  return (
    <div className="chain-node-defs-wrapper">
      <EntitySelectorTree getLabelSuffix={getLabelSuffix} nodeDefUuidActive={entityDefUuid} onSelect={selectEntity} />

      {entityDefUuid && (
        <div className="chain-node-defs" ref={chainNodeDefsRef}>
          <ChainNodeDefsHeader />

          {chainNodeDefs.length > 0 && (
            <div className="chain-node-def__list-header">
              <div />
              <div>{i18n.t('common.name')}</div>
              <div>{i18n.t('common.label')}</div>
              <div>{i18n.t('common.type')}</div>
              <div>{i18n.t('common.active')}</div>
              <div />
            </div>
          )}

          {chainNodeDefs
            .filter((chainNodeDef) => NodeDef.getParentUuid(chainNodeDef) === entityDefUuid)
            .map((chainNodeDef) => (
              <ChainNodeDef key={chainNodeDef.uuid} chainNodeDef={chainNodeDef} />
            ))}
        </div>
      )}
    </div>
  )
}

export { ChainNodeDefs }
