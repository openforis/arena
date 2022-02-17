import { useCallback, useState } from 'react'

import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'
import { validateCategoryItemExtraDef } from '@core/survey/categoryItemExtraDefValidator'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'
import { useConfirm } from '@webapp/components/hooks'

export const useItemExtraDefEditor = (props) => {
  const { index, itemExtraDef: itemExtraDefProp, itemExtraDefs, onItemDelete, onItemUpdate } = props

  const i18n = useI18n()
  const confirm = useConfirm()

  const newItem = itemExtraDefProp.newItem
  const [state, setState] = useState({ editing: newItem, itemExtraDef: itemExtraDefProp })

  const { editing, itemExtraDef } = state
  const { name, dataType, validation } = itemExtraDef
  const dirty =
    name !== CategoryItemExtraDef.getName(itemExtraDefProp) ||
    dataType !== CategoryItemExtraDef.getDataType(itemExtraDefProp)

  const updateItemExtraDef = useCallback(async ({ itemExtraDefUpdated }) => {
    const validation = await validateCategoryItemExtraDef({
      itemExtraDef: itemExtraDefUpdated,
      itemExtraDefsArray: itemExtraDefs,
    })
    setState((statePrev) => ({
      ...statePrev,
      itemExtraDef: Validation.assocValidation(validation)(itemExtraDefUpdated),
    }))
  }, [])

  const onEditClick = () => setState((statePrev) => ({ ...statePrev, editing: true }))

  const onSaveClick = useCallback(async () => {
    const { newItem, validation, ...itemPropsToSave } = itemExtraDef

    const doSave = async () => {
      setState((statePrev) => ({ ...statePrev, editing: false }))
      await onItemUpdate({ index, itemExtraDefUpdated: itemPropsToSave })
    }

    if (newItem) {
      await doSave()
    } else {
      const warnings = []
      const nameOld = CategoryItemExtraDef.getName(itemExtraDefProp)
      const nameNew = CategoryItemExtraDef.getName(itemExtraDef)
      if (nameOld !== nameNew) {
        // name changed
        warnings.push({
          key: 'categoryEdit.extraPropertiesEditor.warnings.nameChanged',
          params: { nameNew, nameOld },
        })
      }
      const dataTypeOld = CategoryItemExtraDef.getDataType(itemExtraDefProp)
      const dataTypeNew = CategoryItemExtraDef.getDataType(itemExtraDef)
      if (dataTypeOld !== dataTypeNew) {
        warnings.push({
          key: 'categoryEdit.extraPropertiesEditor.warnings.dataTypeChanged',
          params: { dataTypeNew, dataTypeOld },
        })
      }
      if (warnings.length > 0) {
        confirm({
          key: 'categoryEdit.extraPropertiesEditor.confirmSave',
          params: { warnings: warnings.map((warning) => `- ${i18n.t(warning.key, warning.params)}`).toString() },
          onOk: doSave,
        })
      } else {
        await doSave()
      }
    }
  }, [itemExtraDef, itemExtraDefProp, confirm, onItemUpdate])

  const onCancelClick = () => {
    setState((statePrev) => ({ ...statePrev, itemExtraDef: itemExtraDefProp, editing: false }))
    if (newItem) {
      onItemDelete({ index })
    }
  }

  return {
    dirty,
    editing,
    i18n,
    itemExtraDef,
    onCancelClick,
    onEditClick,
    onSaveClick,
    updateItemExtraDef,
    validation,
  }
}
