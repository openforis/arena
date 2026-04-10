import './AnalysisNodeDefsHeader.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'

import { ChainActions, useChain } from '@webapp/store/ui/chain'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { Button } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'

const AnalysisNodeDefsHeader = ({ toggleShowSamplingNodeDefs, showSamplingNodeDefs }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
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
          <Button
            iconClassName="icon-plus"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.decimal)}
            label="common:chain.addQuantitative"
            onClick={() => createNodeDef(NodeDef.nodeDefType.decimal)}
          />
          <Button
            iconClassName="icon-plus"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.code)}
            label="common:chain.addCategorical"
            onClick={() => createNodeDef(NodeDef.nodeDefType.code)}
          />
        </div>
      </div>
    </div>
  )
}

export { AnalysisNodeDefsHeader }
