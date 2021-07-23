import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

export const NodeDefInfoIcon = (props) => {
  const { lang, nodeDef } = props

  const description = NodeDef.getDescription(lang)(nodeDef)

  if (!description) return null

  return <span className="icon icon-info icon-12px" title={description} />
}

NodeDefInfoIcon.propTypes = {
  lang: PropTypes.string.isRequired,
  nodeDef: PropTypes.object.isRequired,
}
