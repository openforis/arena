import './nodeDefFormHeader.scss'

import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import Markdown from '@webapp/components/markdown'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'

import { useSurveyPreferredLang } from '@webapp/store/survey'

const NodeDefFormHeader = (props) => {
  const { nodeDef } = props

  const lang = useSurveyPreferredLang()

  const backgroundColor = NodeDefUIProps.headerColorRgbCodesByColor[NodeDef.getHeaderColor(nodeDef)]

  return (
    <div className="survey-form__node-def-form-header" style={{ backgroundColor }}>
      <Markdown source={NodeDef.getLabel(nodeDef, lang)} />
    </div>
  )
}

NodeDefFormHeader.propTypes = {
  nodeDef: PropTypes.object.isRequired,
}

export default NodeDefFormHeader
