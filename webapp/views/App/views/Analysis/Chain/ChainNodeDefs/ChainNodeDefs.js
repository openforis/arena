import './ChainNodeDefs.scss'
import React, { useRef, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { ChainActions, useChainEntityDefUuid, useChain } from '@webapp/store/ui/chain'
import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { EntitySelectorTree } from '@webapp/components/survey/NodeDefsSelector'

import { ChainNodeDefsHeader } from './ChainNodeDefsHeader'
import { ChainNodeDef } from './ChainNodeDef'
import { useSortChainNodeDefs } from './hooks'

const ChainNodeDefs = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const entityDefUuid = useChainEntityDefUuid()

  const chain = useChain()
  const survey = useSurvey()

  const chainNodeDefsRef = useRef(null)

  const selectEntity = (entityDef) => dispatch(ChainActions.updateEntityDefUuid(entityDef.uuid))
  const getLabelSuffix = (entityDef) => {
    const count = (Chain.getChainNodeDefsInEntity({ entity: entityDef })(chain) || []).length
    return count ? ` (${count})` : ''
  }

  const _chainNodeDefsToShow = useMemo(() => {
    const nodeDefs = Survey.getNodeDefsArray(survey)
    const chainNodeDefs = nodeDefs.filter(
      (nodeDef) => NodeDef.isAnalysis(nodeDef) && NodeDef.getChainUuid(nodeDef) === Chain.getUuid(chain)
    )

    return chainNodeDefs
      .filter((chainNodeDef) => NodeDef.getParentUuid(chainNodeDef) === entityDefUuid)
      .sort((nodeDef1, nodeDef2) => NodeDef.getChainIndex(nodeDef1) - NodeDef.getChainIndex(nodeDef2))
  }, [chain, survey, entityDefUuid])

  useSortChainNodeDefs({ chainNodeDefsRef, chainNodeDefs: _chainNodeDefsToShow })

  return (
    <div className="chain-node-defs-wrapper">
      <EntitySelectorTree getLabelSuffix={getLabelSuffix} nodeDefUuidActive={entityDefUuid} onSelect={selectEntity} />

      {entityDefUuid && (
        <div className="chain-node-defs" ref={chainNodeDefsRef}>
          <ChainNodeDefsHeader />

          {_chainNodeDefsToShow.length > 0 && (
            <div className="chain-node-def__list-header">
              <div />
              <div>{i18n.t('common.name')}</div>
              <div>{i18n.t('common.label')}</div>
              <div>{i18n.t('common.type')}</div>
              <div>{i18n.t('common.active')}</div>
              <div />
            </div>
          )}

          {_chainNodeDefsToShow.map((chainNodeDef) => (
            <ChainNodeDef
              key={chainNodeDef.uuid}
              nodeDefUuid={NodeDef.getUuid(chainNodeDef)}
              chainNodeDef={chainNodeDef}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export { ChainNodeDefs }
