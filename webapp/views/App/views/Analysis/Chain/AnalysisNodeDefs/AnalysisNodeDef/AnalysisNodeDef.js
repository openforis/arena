import './AnalysisNodeDef.scss'
import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { useSurvey, NodeDefsActions, useSurveyPreferredLang, useSurveyCycleKey } from '@webapp/store/survey'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useI18n } from '@webapp/store/system'

import InputSwitch from '@webapp/components/form/InputSwitch'
import WarningBadge from '@webapp/components/warningBadge'

const AnalysisNodeDef = ({ nodeDefUuid, dataCount }) => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const nodeDefType = NodeDef.getType(nodeDef)
  const nodeDefDeleted = !nodeDef
  const parentEntity = Survey.getNodeDefParent(nodeDef)(survey)
  const parentEntityName = NodeDef.getName(parentEntity)
  const parentEntityNotInCurrentCycle = !NodeDef.isInCycle(cycle)(parentEntity)
  const noData = dataCount === 0
  const warningShown = noData || parentEntityNotInCurrentCycle

  const handleSetActive = useCallback(() => {
    const active = NodeDef.getActive(nodeDef)
    const newNodeDef = NodeDef.assocProp({ key: NodeDef.keysPropsAdvanced.active, value: !active })(nodeDef)

    dispatch(
      NodeDefsActions.putNodeDefProps({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        parentUuid: NodeDef.getParentUuid(nodeDef),
        propsAdvanced: {
          [NodeDef.keysPropsAdvanced.active]: !active,
        },
      })
    )

    dispatch(NodeDefsActions.updateNodeDef({ nodeDef: newNodeDef }))
  }, [nodeDef])

  return (
    <div className={classNames('analysis-node-def', { deleted: nodeDefDeleted })}>
      <div>
        <button className="analysis-node-def__btn-move" type="button">
          <span className="icon icon-menu" />
        </button>
      </div>
      <div className={classNames('analysis-node-def__entity-name', { 'with-warning': warningShown })}>
        <span className="entity-label" title={parentEntityName}>
          {parentEntityName}
        </span>
        {noData && <WarningBadge title="chain.entityWithoutData" titleParams={{ name: parentEntityName }} />}
        {!noData && parentEntityNotInCurrentCycle && (
          <WarningBadge title="chain.entityNotInCurrentCycle" titleParams={{ name: parentEntityName }} />
        )}
      </div>
      <div>{NodeDef.getName(nodeDef)}</div>
      <div>{NodeDef.getLabel(nodeDef, lang)}</div>
      <div>
        {NodeDef.isDecimal(nodeDef)
          ? Survey.getNodeDefAreaBasedEstimate(nodeDef)(survey)
            ? i18n.t('common.true')
            : i18n.t('common.false')
          : '-'}
      </div>
      <div className="analysis-node-def__type">
        {i18n.t(nodeDefType === NodeDef.nodeDefType.decimal ? 'chain.quantitative' : 'chain.categorical')}
      </div>
      <div>
        <InputSwitch
          checked={!nodeDefDeleted && NodeDef.getActive(nodeDef)}
          disabled={nodeDefDeleted || NodeDef.isSampling(nodeDef)}
          onChange={handleSetActive}
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
  dataCount: PropTypes.number,
}

AnalysisNodeDef.defaultProps = {
  dataCount: undefined,
}

export { AnalysisNodeDef }
