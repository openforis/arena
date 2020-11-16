import React from 'react'
import PropTypes from 'prop-types'
import * as NodeDef from '@core/survey/nodeDef'
import { useI18n } from '@webapp/store/system'

const displayTypes = {
  byName: 'byName',
  byLabel: 'byLabel',
}

const DisplayTypeSelector = ({ onChange, displayType }) => {
  const i18n = useI18n()

  return (
    <button type="button" onClick={onChange}>
      {i18n.t(`common.${displayType === NodeDef.getName ? displayTypes.byName : displayTypes.byLabel}`)}
    </button>
  )
}

DisplayTypeSelector.propTypes = {
  onChange: PropTypes.func,
  displayType: PropTypes.func,
}

DisplayTypeSelector.defaultProps = {
  onChange: () => {},
  displayType: NodeDef.getLabel,
}

export default DisplayTypeSelector
