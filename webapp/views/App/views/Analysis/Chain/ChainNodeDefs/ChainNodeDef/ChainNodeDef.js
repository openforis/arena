import './ChainNodeDef.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { useNodeDefLabel, useSurvey } from '@webapp/store/survey'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

import InputSwitch from '@webapp/components/form/InputSwitch'

const ChainNodeDef = (props) => {
  const { chainNodeDef } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const chain = useChain()
  const nodeDef = Survey.getNodeDefByUuid(chainNodeDef.nodeDefUuid)(survey)
  const nodeDefLabel = useNodeDefLabel(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)

  const updateChainNodeDef = (chainNodeDefUpdate) =>
    dispatch(ChainActions.updateChainNodeDef({ chainNodeDef: chainNodeDefUpdate, chainUuid: chain.uuid }))

  return (
    <div className="chain-node-def">
      <div>{NodeDef.getName(nodeDef)}</div>
      <div>{nodeDefLabel}</div>
      <div className="chain-node-def__type">
        {i18n.t(nodeDefType === NodeDef.nodeDefType.decimal ? 'chain.quantitative' : 'chain.categorical')}
      </div>
      <div>
        <InputSwitch
          onChange={(active) => {
            updateChainNodeDef({ ...chainNodeDef, props: { ...chainNodeDef.props, active } })
          }}
          checked={chainNodeDef.props.active}
        />
      </div>
      <div>
        <Link
          className="btn btn-xs btn-transparent"
          to={`${appModuleUri(analysisModules.nodeDef)}${chainNodeDef.nodeDefUuid}/`}
        >
          <span className="icon icon-pencil2 icon-10px icon-left" />
          {i18n.t('common.edit')}
        </Link>
      </div>
    </div>
  )
}

ChainNodeDef.propTypes = {
  chainNodeDef: PropTypes.object.isRequired,
}

export { ChainNodeDef }
