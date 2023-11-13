import './nodeDefFormHeader.scss'

import React from 'react'

import * as NodeDef from '@core/survey/nodeDef'

import Markdown from '@webapp/components/markdown'

import { useSurveyPreferredLang } from '@webapp/store/survey'

const NodeDefFormHeader = ({ nodeDef }) => {
  const lang = useSurveyPreferredLang()

  return (
    <div className="survey-form__node-def-form-header" style={{ backgroundColor: NodeDef.getHeaderColor(nodeDef) }}>
      <Markdown source={NodeDef.getLabel(nodeDef, lang)} />
    </div>
  )
}

export default NodeDefFormHeader
