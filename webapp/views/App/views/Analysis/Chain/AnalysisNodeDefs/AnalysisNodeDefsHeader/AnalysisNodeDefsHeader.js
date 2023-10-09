import './AnalysisNodeDefsHeader.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useI18n } from '@webapp/store/system'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { Checkbox } from '@webapp/components/form'

const AnalysisNodeDefsHeader = ({ toggleShowSamplingNodeDefs, showSamplingNodeDefs }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const chain = useChain()

  const createNodeDef = (type) => dispatch(ChainActions.createNodeDef({ navigate, type }))

  return (
    <div className="analysis-node-defs-header">
      <div className="analysis-node-defs-header__buttons_container">
        {Chain.hasSamplingDesign(chain) && (
          <Checkbox
            checked={showSamplingNodeDefs}
            label="chainView.showSamplingAttributes"
            onChange={toggleShowSamplingNodeDefs}
          />
        )}
        <div className="analysis-node-defs-header__buttons">
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
    </div>
  )
}

export { AnalysisNodeDefsHeader }
