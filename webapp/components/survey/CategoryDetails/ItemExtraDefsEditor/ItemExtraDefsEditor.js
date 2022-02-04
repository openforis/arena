import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import { State, useActions, useLocalState } from '../store'
import { Input } from '@webapp/components/form/Input'
import { Button, ButtonAdd, ButtonSave } from '@webapp/components'
import { updateItem } from '@server/modules/collectImport/repository/collectImportReportRepository'

export const ItemExtraDefsEditor = (props) => {
  const { state: categoryState, setState: setCategoryState } = props

  const Actions = useActions({ setState: setCategoryState })
  const readOnly = !useAuthCanEditSurvey()

  const category = State.getCategory(categoryState)

  const itemExtraDefsSaved = Category.getItemExtraDef(category)

  const [state, setState] = useState({
    editing: false,
    itemExtraDefs: Object.entries(itemExtraDefsSaved).map(([name, extraDef]) => ({ ...extraDef, name })),
  })

  const { editing, itemExtraDefs } = state

  const updateItemExraDefs = useCallback((itemExtraDefsUpdated) => {
    setState((statePrev) => ({
      ...statePrev,
      itemExtraDefs: itemExtraDefsUpdated,
    }))
  }, [])

  const onAdd = useCallback(() => {
    updateItemExraDefs([...itemExtraDefs, { name: '', dataType: Category.itemExtraDefDataTypes.text }])
  }, [])

  const onSave = useCallback(() => {
    Actions.updateCategoryProp({ key: Category.keysProps.itemExtraDef, value: itemExtraDefs })
  }, [])

  return (
    <fieldset className="category__extra-props">
      <legend>{i18n.t('categoryEdit.extraProp', { count: 2 })}</legend>
      {itemExtraDefs.map(([key, itemExtraDef], index) => {
        const { dataType } = itemExtraDef
        return (
          <FormItem label={`${i18n.t('categoryEdit.extraProp')} ${index + 1}`} key={String(index)}>
            <Input
              value={key}
              numberFormat={dataType === Category.itemExtraDefDataTypes.number ? NumberFormats.decimal() : null}
              readOnly={readOnly}
              onChange={(value) => {
                const valueNormalized = StringUtils.normalizeName(value)
                const itemExtraDefsUpdated = [...itemExtraDefs]
                itemExtraDefsUpdated[index] = { ...itemExtraDef, name: valueNormalized }
                updateItemExraDefs(itemExtraDefsUpdated)
              }}
            />
          </FormItem>
        )
      })}
      <ButtonAdd onClick={onAdd} />

      <ButtonSave onClick={onSave} />
    </fieldset>
  )
}
