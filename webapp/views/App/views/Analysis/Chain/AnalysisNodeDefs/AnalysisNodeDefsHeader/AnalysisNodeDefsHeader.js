import './AnalysisNodeDefsHeader.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain } from '@webapp/store/ui/chain'
import { useI18n } from '@webapp/store/system'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

const AnalysisNodeDefsHeader = ({ toggleShowSamplingNodeDefs, showSamplingNodeDefs }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const chain = useChain()

  const createNodeDef = (type) => dispatch(ChainActions.createNodeDef({ navigate, type }))

  return (
    <div className="analysis-node-defs-header">
      <div className="analysis-node-defs-header__buttons_container">
        {Chain.isSamplingDesign(chain) && (
          <div className="analysis-node-defs-header__buttons analysis-node-defs-header__filter">
            <div>
              <button className="btn btn-s" onClick={toggleShowSamplingNodeDefs} type="button">
                {showSamplingNodeDefs ? i18n.t('common.hide') : i18n.t('common.show')}{' '}
                {i18n.t('chainView.samplingNodeDefs')}
              </button>
            </div>
          </div>
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
