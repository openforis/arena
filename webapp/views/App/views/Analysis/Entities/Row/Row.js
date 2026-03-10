import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import { useNodeDefByUuid, useSurveyPreferredLang } from '@webapp/store/survey'

const Row = (props) => {
  const { row: entityDef } = props
  const parentDef = useNodeDefByUuid(NodeDef.getParentUuid(entityDef))
  const lang = useSurveyPreferredLang()

  return (
    <>
      <div />
      <div>{NodeDef.getName(entityDef)}</div>
      <div>{NodeDef.getLabel(entityDef, lang)}</div>
      <div>{NodeDef.getName(parentDef)}</div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
