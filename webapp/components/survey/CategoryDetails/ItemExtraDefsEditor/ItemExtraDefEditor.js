import React, { useCallback, useState } from 'react'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'
import { validateCategoryItemExtraDef } from '@core/survey/categoryItemExtraDefValidator'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { ButtonCancel, ButtonDelete, ButtonIconEdit, ButtonSave } from '@webapp/components'
import { useConfirm } from '@webapp/components/hooks'

export const ItemExtraDefEditor = (props) => {
  const { index, itemExtraDef: itemExtraDefProp, itemExtraDefs, readOnly, onItemDelete, onItemUpdate } = props

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
    setState((statePrev) => ({ ...statePrev, editing: false }))
    if (newItem) {
      onItemDelete({ index })
    }
  }

  return (
    <FormItem label={`${i18n.t('categoryEdit.extraProp')} ${index + 1}`}>
      <Input
        value={name}
        readOnly={readOnly || !editing}
        onChange={(value) => {
          const valueNormalized = StringUtils.normalizeName(value)
          const itemExtraDefUpdated = { ...itemExtraDef, name: valueNormalized }
          updateItemExtraDef({ itemExtraDefUpdated })
        }}
        validation={Validation.getFieldValidation(CategoryItemExtraDef.keys.name)(validation)}
      />
      <Dropdown
        readOnlyInput
        readOnly={readOnly || !editing}
        items={Object.keys(CategoryItemExtraDef.dataTypes)}
        itemKey={A.identity}
        itemLabel={(item) => i18n.t(`categoryEdit.extraPropDataType.${item}`)}
        selection={dataType}
        onChange={(dataTypeUpdated) =>
          updateItemExtraDef({ itemExtraDefUpdated: { ...itemExtraDef, dataType: dataTypeUpdated } })
        }
        validation={Validation.getFieldValidation(CategoryItemExtraDef.keys.dataType)(validation)}
      />
      {!editing && (
        <>
          <ButtonIconEdit disabled={readOnly} showLabel={false} onClick={onEditClick} />
          <ButtonDelete disabled={readOnly} showLabel={false} onClick={() => onItemDelete({ index })} />
        </>
      )}
      {editing && (
        <>
          <ButtonSave
            className="btn-save"
            showLabel={false}
            disabled={Validation.isNotValid(validation) || !dirty}
            onClick={onSaveClick}
          />
          <ButtonCancel
            className="btn-cancel"
            iconClassName="icon-cross icon-12px"
            showLabel={false}
            onClick={onCancelClick}
          />
        </>
      )}
    </FormItem>
  )
}
