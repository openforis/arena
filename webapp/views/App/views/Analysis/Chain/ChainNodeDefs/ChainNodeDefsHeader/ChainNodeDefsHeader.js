import './ChainNodeDefsHeader.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChainEntityDefUuid } from '@webapp/store/ui/chain'
import { useNodeDefLabel, useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

const ChainNodeDefsHeader = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()
  const survey = useSurvey()
  const entityDefUuid = useChainEntityDefUuid()
  const nodeDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const nodeDefLabel = useNodeDefLabel(nodeDef)

  const createNodeDef = (type) => dispatch(ChainActions.createNodeDef({ history, type }))

  return (
    <div className="chain-node-defs-header">
      <div className="chain-node-defs__header-label">{nodeDefLabel}</div>

      <div className="chain-node-defs-header__buttons">
        <div>
          {i18n.t('common.add')} <span className="icon icon-plus icon-12px" />
        </div>
        <button className="btn btn-s" onClick={() => createNodeDef(NodeDef.nodeDefType.decimal)} type="button">
          {i18n.t('chain.quantitative')} {NodeDefUIProps.getIconByType(NodeDef.nodeDefType.decimal)}
        </button>
        <button className="btn btn-s" onClick={() => createNodeDef(NodeDef.nodeDefType.code)} type="button">
          {i18n.t('chain.categorical')} {NodeDefUIProps.getIconByType(NodeDef.nodeDefType.code)}
        </button>
      </div>
    </div>
  )
}

export { ChainNodeDefsHeader }
