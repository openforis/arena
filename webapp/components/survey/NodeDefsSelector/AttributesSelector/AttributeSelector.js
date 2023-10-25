import './AttributeSelector.scss'
import React from 'react'
import * as PropTypes from 'prop-types'
import * as R from 'ramda'
import classNames from 'classnames'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import NodeDefIconKey from '@webapp/components/survey/SurveyForm/nodeDefs/components/NodeDefIconKey'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const AttributeSelector = (props) => {
  const { canSelectAttributes, nodeDef, nodeDefUuidsAttributes, onToggleAttribute, showNodeDefPath, nodeDefLabelType } =
    props

  const i18n = useI18n()
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefType = NodeDef.getType(nodeDef)
  const active = R.includes(nodeDefUuid, nodeDefUuidsAttributes)

  return (
    <button
      type="button"
      className={classNames('btn btn-s deselectable attribute-selector', {
        active,
        'not-selectable': !canSelectAttributes,
      })}
      onClick={canSelectAttributes ? () => onToggleAttribute(nodeDefUuid) : null}
      title={
        showNodeDefPath
          ? Survey.getNodeDefPath({ nodeDef, showLabels: true, labelLang: lang })(survey)
          : NodeDef.getDescription(lang)(nodeDef)
      }
    >
      <span>
        <NodeDefIconKey nodeDef={nodeDef} />
        {NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })}
      </span>
      <div className="node-def__icon-wrapper">
        {NodeDef.isMultiple(nodeDef) && <span title={i18n.t('nodeDefEdit.basicProps.multiple')}>M</span>}
        {NodeDefUIProps.getIconByType(nodeDefType)}
      </div>
    </button>
  )
}

AttributeSelector.propTypes = {
  canSelectAttributes: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  nodeDefUuidsAttributes: PropTypes.array.isRequired,
  onToggleAttribute: PropTypes.func.isRequired,
  showNodeDefPath: PropTypes.bool,
  nodeDefLabelType: PropTypes.string,
}

AttributeSelector.defaultProps = {
  canSelectAttributes: true,
  showNodeDefPath: false,
  nodeDefLabelType: NodeDef.NodeDefLabelTypes.label,
}

export default AttributeSelector
