import React, { useState } from 'react'
import * as NodeDef from '@core/survey/nodeDef'
import { useI18n } from '@webapp/store/system'

import ButtonGroup from '@webapp/components/form/buttonGroup'

const labelTypesKeys = {
  byName: 'byName',
  byLabel: 'byLabel',
}
const labelTypes = ({ i18n }) => [
  {
    key: labelTypesKeys.byName,
    label: i18n.t(`common.${labelTypesKeys.byName}`),
  },
  {
    key: labelTypesKeys.byLabel,
    label: i18n.t(`common.${labelTypesKeys.byLabel}`),
  },
]

export const useLabelFunctionSelector = () => {
  const i18n = useI18n()

  const [showByName, setShowByName] = useState(false)

  const toggleByName = () => {
    setShowByName(!showByName)
  }

  return {
    ItemLabelFunctionSelector: () => (
      <ButtonGroup
        selectedItemKey={showByName ? labelTypesKeys.byName : labelTypesKeys.byLabel}
        onChange={toggleByName}
        items={labelTypes({ i18n })}
      />
    ),
    showByName,
    toggleByName,
    itemLabelFunction: showByName ? NodeDef.getName : NodeDef.getLabel,
  }
}
