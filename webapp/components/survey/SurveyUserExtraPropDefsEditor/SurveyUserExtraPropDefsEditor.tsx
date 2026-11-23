import { useCallback, useMemo } from 'react'

import * as ObjectUtils from '@core/objectUtils'
import { ExtraPropDef } from '@core/survey/extraPropDef'

import { ExtraPropDefsEditor } from '@webapp/components/survey/ExtraPropDefsEditor'

type SurveyUserExtraPropDefsEditorProps = {
  extraPropDefs: Record<string, any>
  onExtraPropDefDelete?: (...args: any[]) => any
  onExtraPropDefUpdate?: (...args: any[]) => any
  onExtraPropDefsUpdate?: (...args: any[]) => any
}

export const SurveyUserExtraPropDefsEditor = (props: SurveyUserExtraPropDefsEditorProps) => {
  const {
    extraPropDefs = {},
    onExtraPropDefDelete: onExtraPropDefDeleteProp,
    onExtraPropDefUpdate: onExtraPropDefUpdateProp,
    onExtraPropDefsUpdate,
  } = props

  const userExtraPropDefsArray = useMemo(() => ExtraPropDef.extraDefsToArray(extraPropDefs), [extraPropDefs])

  const onExtraPropDefUpdate = useCallback(
    ({ extraPropDef }) => {
      const index = ExtraPropDef.getIndex(extraPropDef)
      const prevExtraPropDef = userExtraPropDefsArray[index]
      onExtraPropDefUpdateProp?.({ prevExtraPropDef, extraPropDef })
      if (onExtraPropDefsUpdate) {
        const extraPropDefsArrayUpdated = [...userExtraPropDefsArray]
        extraPropDefsArrayUpdated[index] = extraPropDef
        const extraPropDefsUpdated = ObjectUtils.toIndexedObj(extraPropDefsArrayUpdated, ExtraPropDef.keys.name)
        onExtraPropDefsUpdate(extraPropDefsUpdated)
      }
    },
    [onExtraPropDefUpdateProp, onExtraPropDefsUpdate, userExtraPropDefsArray]
  )

  const onExtraPropDefDelete = useCallback(
    ({ propName }) => {
      const extraPropDef = extraPropDefs[propName]
      onExtraPropDefDeleteProp?.(extraPropDef)
      if (onExtraPropDefsUpdate) {
        const extraPropDefsUpdated = { ...extraPropDefs }
        delete extraPropDefsUpdated[propName]
        onExtraPropDefsUpdate(extraPropDefsUpdated)
      }
    },
    [extraPropDefs, onExtraPropDefDeleteProp, onExtraPropDefsUpdate]
  )

  return (
    <ExtraPropDefsEditor
      availableDataTypes={[ExtraPropDef.dataTypes.number, ExtraPropDef.dataTypes.text]}
      extraPropDefs={userExtraPropDefsArray}
      infoTextKey="homeView:surveyInfo.userExtraProps.info"
      onExtraPropDefDelete={onExtraPropDefDelete}
      onExtraPropDefUpdate={onExtraPropDefUpdate}
    />
  )
}
