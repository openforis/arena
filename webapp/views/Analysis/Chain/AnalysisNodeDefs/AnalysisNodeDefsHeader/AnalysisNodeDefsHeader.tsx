import './AnalysisNodeDefsHeader.scss'

import { useNavigate } from 'react-router'

import * as Chain from '@common/analysis/chain'
import * as NodeDef from '@core/survey/nodeDef'
import { Button } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { useAppDispatch } from '@webapp/store'
import { ChainActions, useChain, useChainEditable } from '@webapp/store/ui/chain'

type AnalysisNodeDefsHeaderProps = {
  toggleShowSamplingNodeDefs: () => void
  showSamplingNodeDefs: boolean
}

const AnalysisNodeDefsHeader = ({ toggleShowSamplingNodeDefs, showSamplingNodeDefs }: AnalysisNodeDefsHeaderProps) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const chain = useChain()
  const editable = useChainEditable()

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
            iconName="add"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.decimal)}
            label="common:chain.addQuantitative"
            onClick={() => createNodeDef(NodeDef.nodeDefType.decimal)}
            disabled={!editable}
          />
          <Button
            iconName="add"
            iconEnd={NodeDefUIProps.getIconByType(NodeDef.nodeDefType.code)}
            label="common:chain.addCategorical"
            onClick={() => createNodeDef(NodeDef.nodeDefType.code)}
            disabled={!editable}
          />
        </div>
      </div>
    </div>
  )
}

export { AnalysisNodeDefsHeader }
