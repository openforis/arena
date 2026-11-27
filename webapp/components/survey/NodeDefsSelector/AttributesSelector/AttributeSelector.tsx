import './AttributeSelector.scss'

import classNames from 'classnames'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import NodeDefIconKey from '@webapp/components/survey/SurveyForm/nodeDefs/components/NodeDefIconKey'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

type AttributeSelectorProps = {
  canSelectAttributes?: boolean
  labelFunction?: (...args: any[]) => any
  nodeDef: ArenaAnyNodeDef
  nodeDefUuidsAttributes: any[]
  onToggleAttribute: (...args: any[]) => any
  showNodeDefPath?: boolean
  nodeDefLabelType?: NodeDef.NodeDefLabelType
}

const AttributeSelector = (props: AttributeSelectorProps) => {
  const {
    canSelectAttributes = true,
    labelFunction,
    nodeDef,
    nodeDefLabelType = NodeDef.NodeDefLabelTypes.label,
    nodeDefUuidsAttributes,
    onToggleAttribute,
    showNodeDefPath = false,
  } = props

  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()

  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const active = A.includes(nodeDefUuid, nodeDefUuidsAttributes)

  const label = labelFunction
    ? labelFunction(nodeDef)
    : NodeDef.getLabelWithType({ nodeDef, lang, type: nodeDefLabelType })

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
        {label}
      </span>
      {NodeDefUIProps.getIconByNodeDef({ nodeDef, cycle, size: 12 })}
    </button>
  )
}

export default AttributeSelector
