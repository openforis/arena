import './ChainNodeDef.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { useSurvey, NodeDefsActions } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

import InputSwitch from '@webapp/components/form/InputSwitch'

const ChainNodeDef = ({ nodeDefUuid }) => {
  const survey = useSurvey()
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const dispatch = useDispatch()
  const i18n = useI18n()
  const nodeDefType = NodeDef.getType(nodeDef)
  const nodeDefDeleted = !nodeDef

  const updateChainNodeDef = () => {
    const newNodeDef = {
      ...nodeDef,
      [NodeDef.keys.propsAdvanced]: {
        ...NodeDef.getPropsAdvanced(nodeDef),
        ...NodeDef.getPropsAdvancedDraft(nodeDef),
        [NodeDef.keysPropsAdvanced.active]: !NodeDef.getActive(nodeDef),
      },
    }

    dispatch(
      NodeDefsActions.putNodeDefProps({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        parentUuid: NodeDef.getParentUuid(nodeDef),
        props: { ...NodeDef.getProps(nodeDef), ...NodeDef.getPropsDraft(nodeDef) },
        propsAdvanced: {
          ...NodeDef.getPropsAdvanced(nodeDef),
          ...NodeDef.getPropsAdvancedDraft(nodeDef),
          [NodeDef.keysPropsAdvanced.active]: !NodeDef.getActive(nodeDef),
        },
      })
    )

    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: newNodeDef }))
  }

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
          onChange={updateChainNodeDef}
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
  nodeDefUuid: PropTypes.string.isRequired,
}

export { ChainNodeDef }
