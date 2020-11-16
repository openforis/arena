import React from 'react'
import PropTypes from 'prop-types'
import * as NodeDef from '@core/survey/nodeDef'
import { useI18n } from '@webapp/store/system'

const labelTypesKeys = {
  byName: 'byName',
  byLabel: 'byLabel',
}

const ItemLabelFunctionSelector = ({ onChange, itemLabelFunction }) => {
  const i18n = useI18n()

  return (
    <button type="button" onClick={onChange}>
      {i18n.t(`common.${itemLabelFunction === NodeDef.getName ? labelTypesKeys.byName : labelTypesKeys.byLabel}`)}
    </button>
  )
}

ItemLabelFunctionSelector.propTypes = {
  onChange: PropTypes.func,
  itemLabelFunction: PropTypes.func,
}

ItemLabelFunctionSelector.defaultProps = {
  onChange: () => {},
  itemLabelFunction: NodeDef.getLabel,
}

export default ItemLabelFunctionSelector
