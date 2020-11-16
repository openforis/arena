import React from 'react'
import PropTypes from 'prop-types'
import * as NodeDef from '@core/survey/nodeDef'
import { useI18n } from '@webapp/store/system'

const displayTypes = {
  byName: 'byName',
  byLabel: 'byLabel',
}

const NodeDefDisplayTypeSelector = ({ onChange, nodeDefDisplayType }) => {
  const i18n = useI18n()

  return (
    <button type="button" onClick={onChange}>
      {i18n.t(`common.${nodeDefDisplayType === NodeDef.getName ? displayTypes.byName : displayTypes.byLabel}`)}
    </button>
  )
}

NodeDefDisplayTypeSelector.propTypes = {
  onChange: PropTypes.func,
  nodeDefDisplayType: PropTypes.func,
}

NodeDefDisplayTypeSelector.defaultProps = {
  onChange: () => {},
  nodeDefDisplayType: NodeDef.getLabel,
}

export default NodeDefDisplayTypeSelector
