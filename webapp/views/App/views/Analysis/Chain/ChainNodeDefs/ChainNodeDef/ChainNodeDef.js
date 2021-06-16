import './ChainNodeDef.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'
import { ChainActions, useChain } from '@webapp/store/ui/chain'

import InputSwitch from '@webapp/components/form/InputSwitch'

const ChainNodeDef = (props) => {
  const { chainNodeDef: nodeDef } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const chain = useChain()
  const nodeDefType = NodeDef.getType(nodeDef)
  const nodeDefDeleted = !nodeDef

  const updateChainNodeDef = (chainNodeDefUpdate) =>
    dispatch(ChainActions.updateChainNodeDef({ chainNodeDef: chainNodeDefUpdate, chainUuid: chain.uuid }))

  return (
    <div className={classNames('chain-node-def', { deleted: nodeDefDeleted })}>
      <div>
        <button className="chain-node-def__btn-move" type="button">
          <span className="icon icon-14px icon-menu" />
        </button>
      </div>
      <div>{NodeDef.getName(nodeDef)}</div>
      <div>{NodeDef.getLabel(nodeDef)}</div>
      <div className="chain-node-def__type">
        {i18n.t(nodeDefType === NodeDef.nodeDefType.decimal ? 'chain.quantitative' : 'chain.categorical')}
      </div>
      <div>
        <InputSwitch
          checked={!nodeDefDeleted && NodeDef.getActive(nodeDef)}
          disabled={nodeDefDeleted}
          onChange={(active) => {
            updateChainNodeDef({ ...nodeDef, props: { ...nodeDef.props, active } })
          }}
        />
      </div>
      <div>
        <Link
          className="btn btn-xs btn-transparent"
          to={`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`}
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
