import './nodeDefFormHeader.scss'

import * as NodeDef from '@core/survey/nodeDef'

import Markdown from '@webapp/components/markdown'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { useSurveyPreferredLang } from '@webapp/store/survey'
import type { ArenaAnyNodeDef } from '@openforis/arena-core'

type NodeDefFormHeaderProps = {
  nodeDef: ArenaAnyNodeDef
}

const NodeDefFormHeader = (props: NodeDefFormHeaderProps) => {
  const { nodeDef } = props

  const lang = useSurveyPreferredLang()

  const backgroundColor = NodeDefUIProps.headerColorRgbCodesByColor[NodeDef.getHeaderColor(nodeDef)]

  return (
    <div className="survey-form__node-def-form-header" style={{ backgroundColor }}>
      <Markdown source={NodeDef.getLabel(nodeDef, lang)} />
    </div>
  )
}

export default NodeDefFormHeader
