import { useCallback, useEffect, useMemo, useState } from 'react'

import { ExtraPropDef } from '@core/survey/extraPropDef'
import { validateExtraPropDef } from '@core/survey/extraPropDefValidator'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useConfirm } from '@webapp/components/hooks'

export const useExtraPropDefEditor = (props) => {
  const { index, extraPropDef: extraPropDefProp, extraPropDefs, onItemDelete, onItemUpdate } = props

  const i18n = useI18n()
  const confirm = useConfirm()

  const initialState = useMemo(
    () => ({ editing: extraPropDefProp.newItem, extraPropDef: extraPropDefProp }),
    [extraPropDefProp]
  )
  const [state, setState] = useState(initialState)
  const { editing, extraPropDef } = state
  const { name, dataType, newItem, validation } = extraPropDef

  const dirty =
    name !== ExtraPropDef.getName(extraPropDefProp) || dataType !== ExtraPropDef.getDataType(extraPropDefProp)

  useEffect(() => {
    setState(initialState)
  }, [initialState])

  const updateExtraPropDef = useCallback(
    async ({ extraPropDefUpdated }) => {
      const validation = await validateExtraPropDef({
        extraPropDef: extraPropDefUpdated,
        extraPropDefsArray: extraPropDefs,
      })
      setState((statePrev) => ({
        ...statePrev,
        extraPropDef: Validation.assocValidation(validation)(extraPropDefUpdated),
      }))
    },
    [extraPropDefs]
  )

  const onEditClick = () => setState((statePrev) => ({ ...statePrev, editing: true }))

  const onSaveClick = useCallback(async () => {
    const { newItem, validation, ...extraPropDefToSave } = extraPropDef

    const doSave = async () => {
      setState((statePrev) => ({ ...statePrev, editing: false }))
      await onItemUpdate({ index, extraPropDefUpdated: extraPropDefToSave })
    }

    if (newItem) {
      await doSave()
    } else {
      const warnings = []
      const nameOld = ExtraPropDef.getName(extraPropDefProp)
      const nameNew = ExtraPropDef.getName(extraPropDef)
      if (nameOld !== nameNew) {
        // name changed
        warnings.push({
          key: 'extraProp.editor.warnings.nameChanged',
          params: { nameNew, nameOld },
        })
      }
      const dataTypeOld = ExtraPropDef.getDataType(extraPropDefProp)
      const dataTypeNew = ExtraPropDef.getDataType(extraPropDef)
      if (dataTypeOld !== dataTypeNew) {
        warnings.push({
          key: 'extraProp.editor.warnings.dataTypeChanged',
          params: { dataTypeNew, dataTypeOld },
        })
      }
      if (warnings.length > 0) {
        confirm({
          key: 'extraProp.editor.confirmSave',
          params: { warnings: warnings.map((warning) => `- ${i18n.t(warning.key, warning.params)}`).toString() },
          onOk: doSave,
        })
      } else {
        await doSave()
      }
    }
  }, [confirm, extraPropDef, extraPropDefProp, i18n, index, onItemUpdate])

  const onCancelClick = () => {
    setState((statePrev) => ({ ...statePrev, extraPropDef: extraPropDefProp, editing: false }))
    if (newItem) {
      onItemDelete({ index })
    }
  }

  return {
    dirty,
    editing,
    i18n,
    extraPropDef,
    onCancelClick,
    onEditClick,
    onSaveClick,
    updateExtraPropDef,
    validation,
  }
}
