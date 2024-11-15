import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Validation from '@core/validation/validation'

import { FormItem, Input } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { ItemEditButtonBar } from '@webapp/components/ItemEditButtonBar'

import { useExtraPropDefEditor } from './useExtraPropDefEditor'

export const ExtraPropDefEditor = (props) => {
  const { availableDataTypes = Object.keys(ExtraPropDef.dataTypes), index, readOnly = false, onItemDelete } = props
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
        items={availableDataTypes}
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
      <ItemEditButtonBar
        dirty={dirty}
        editing={editing}
        onCancel={onCancelClick}
        onDelete={() => onItemDelete({ index })}
        onEdit={onEditClick}
        onSave={onSaveClick}
        readOnly={readOnly}
        validation={validation}
      />
    </FormItem>
  )
}

ExtraPropDefEditor.propTypes = {
  availableDataTypes: PropTypes.array,
  index: PropTypes.number.isRequired,
  readOnly: PropTypes.bool,
  onItemDelete: PropTypes.func.isRequired,
}
