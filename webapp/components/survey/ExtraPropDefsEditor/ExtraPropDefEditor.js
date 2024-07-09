import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { ButtonCancel, ButtonDelete, ButtonIconEdit, ButtonSave } from '@webapp/components'

import { useExtraPropDefEditor } from './useExtraPropDefEditor'

export const ExtraPropDefEditor = (props) => {
  const { index, readOnly = false, onItemDelete } = props
  const {
    dirty,
    editing,
    i18n,
    extraPropDef,
    onCancelClick,
    onEditClick,
    onSaveClick,
    updateExtraPropDef,
    validation,
  } = useExtraPropDefEditor(props)

  const { name, dataType } = extraPropDef

  return (
    <FormItem label={`${i18n.t('extraProp.label')} ${index + 1}`}>
      <Input
        value={name}
        readOnly={readOnly || !editing}
        onChange={(value) => {
          const valueNormalized = StringUtils.normalizeName(value)
          const extraPropDefUpdated = { ...extraPropDef, name: valueNormalized }
          updateExtraPropDef({ extraPropDefUpdated })
        }}
        validation={Validation.getFieldValidation(ExtraPropDef.keys.name)(validation)}
      />
      <Dropdown
        clearable={false}
        items={Object.keys(ExtraPropDef.dataTypes)}
        itemValue={A.identity}
        itemLabel={(item) => i18n.t(`extraProp.dataTypes.${item}`)}
        readOnly={readOnly || !editing}
        searchable={false}
        selection={dataType}
        onChange={(dataTypeUpdated) =>
          updateExtraPropDef({ extraPropDefUpdated: { ...extraPropDef, dataType: dataTypeUpdated } })
        }
        validation={Validation.getFieldValidation(ExtraPropDef.keys.dataType)(validation)}
      />
      {!editing && !readOnly && (
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
          <ButtonCancel showLabel={false} onClick={onCancelClick} />
        </>
      )}
    </FormItem>
  )
}

ExtraPropDefEditor.propTypes = {
  index: PropTypes.number.isRequired,
  readOnly: PropTypes.bool,
  onItemDelete: PropTypes.func.isRequired,
}
