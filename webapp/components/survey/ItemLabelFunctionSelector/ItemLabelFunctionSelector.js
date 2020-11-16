import React from 'react'
import * as NodeDef from '@core/survey/nodeDef'
import { useI18n } from '@webapp/store/system'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import { useDispatch, useSelector } from 'react-redux'
import { SurveyFormActions, SurveyFormState } from '@webapp/store/ui'

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

const ItemLabelFunctionSelector = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  const nodeDefLabelFunction = useSelector(SurveyFormState.nodeDefLabelFunction)

  const toggleLabelFunction = () => {
    dispatch(SurveyFormActions.toggleNodeDefLabelFunction())
  }

  return (
    <ButtonGroup
      selectedItemKey={nodeDefLabelFunction === NodeDef.getName ? labelTypesKeys.byName : labelTypesKeys.byLabel}
      onChange={toggleLabelFunction}
      items={labelTypes({ i18n })}
    />
  )
}

export default ItemLabelFunctionSelector
