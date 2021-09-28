import './AnalysisNodeDef.scss'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { useSurvey, NodeDefsActions, useSurveyPreferredLang } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

import InputSwitch from '@webapp/components/form/InputSwitch'

const AnalysisNodeDef = ({ nodeDefUuid }) => {
  const survey = useSurvey()
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)

  const dispatch = useDispatch()
  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const nodeDefType = NodeDef.getType(nodeDef)
  const nodeDefDeleted = !nodeDef

  const updateAnalysisNodeDef = () => {
    const newNodeDef = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.active, value: !NodeDef.getActive(nodeDef) })(
      nodeDef
    )

    dispatch(
      NodeDefsActions.putNodeDefProps({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        parentUuid: NodeDef.getParentUuid(nodeDef),
        propsAdvanced: {
          [NodeDef.keysPropsAdvanced.active]: !NodeDef.getActive(nodeDef),
        },
      })
    )

    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: newNodeDef }))
  }

  return (
    <div className={classNames('analysis-node-def', { deleted: nodeDefDeleted })}>
      <div>
        <button className="analysis-node-def__btn-move" type="button">
          <span className="icon icon-14px icon-menu" />
        </button>
      </div>
      <div>{Survey.getNodeDefParent(nodeDef)(survey)}</div>
      <div>{NodeDef.getName(nodeDef)}</div>
      <div>{NodeDef.getLabel(nodeDef, lang)}</div>
      <div className="analysis-node-def__type">
        {i18n.t(nodeDefType === NodeDef.nodeDefType.decimal ? 'chain.quantitative' : 'chain.categorical')}
      </div>
      <div>
        <InputSwitch
          checked={!nodeDefDeleted && NodeDef.getActive(nodeDef)}
          disabled={nodeDefDeleted}
          onChange={updateAnalysisNodeDef}
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

AnalysisNodeDef.propTypes = {
  nodeDefUuid: PropTypes.string.isRequired,
}

export { AnalysisNodeDef }
