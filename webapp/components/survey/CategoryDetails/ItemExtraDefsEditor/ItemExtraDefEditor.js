import React from 'react'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'
import * as Validation from '@core/validation/validation'

import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { ButtonDelete } from '@webapp/components'

export const ItemExtraDefEditor = (props) => {
  const { index, itemExtraDef, readOnly, onItemDelete, updateItemExtraDef } = props
  const { name, dataType, validation } = itemExtraDef

  const i18n = useI18n()

  return (
    <FormItem label={`${i18n.t('categoryEdit.extraProp')} ${index + 1}`} key={String(index)}>
      <Input
        value={name}
        numberFormat={dataType === CategoryItemExtraDef.dataTypes.number ? NumberFormats.decimal() : null}
        readOnly={readOnly}
        onChange={(value) => {
          const valueNormalized = StringUtils.normalizeName(value)
          const itemExtraDefUpdated = { ...itemExtraDef, name: valueNormalized }
          updateItemExtraDef({ index, itemExtraDefUpdated })
        }}
        validation={Validation.getFieldValidation(CategoryItemExtraDef.keys.name)(validation)}
      />
      <Dropdown
        readOnlyInput
        readOnly={readOnly}
        items={Object.keys(CategoryItemExtraDef.dataTypes)}
        itemKey={A.identity}
        itemLabel={(item) => i18n.t(`categoryEdit.extraPropDataType.${item}`)}
        selection={dataType}
        onChange={(dataTypeUpdated) =>
          updateItemExtraDef({ index, itemExtraDefUpdated: { ...itemExtraDef, dataType: dataTypeUpdated } })
        }
        validation={Validation.getFieldValidation(CategoryItemExtraDef.keys.dataType)(validation)}
      />
      <ButtonDelete showLabel={false} onClick={() => onItemDelete({ index })} />
    </FormItem>
  )
}
