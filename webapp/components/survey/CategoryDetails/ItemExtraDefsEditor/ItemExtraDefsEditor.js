import './ItemExtraDefsEditor.scss'

import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { useParams } from 'react-router'

import * as A from '@core/arena'

import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { State, useActions } from '../store'
import { FormItem, Input } from '@webapp/components/form/Input'
import {
  Button,
  ButtonAdd,
  ButtonDelete,
  ButtonIconEdit,
  ButtonSave,
  ExpansionPanel,
  PanelRight,
} from '@webapp/components'
import { Dropdown } from '@webapp/components/form'
import { ArrayUtils } from '@core/arrayUtils'

export const ItemExtraDefsEditor = (props) => {
  const { state: categoryState, setState: setCategoryState } = props

  const i18n = useI18n()
  const Actions = useActions({ setState: setCategoryState })
  const readOnly = !useAuthCanEditSurvey()

  const category = State.getCategory(categoryState)

  const calculateInitialState = useCallback(() => {
    const itemExtraDefsSaved = Category.getItemExtraDef(category)
    return {
      itemExtraDefs: Object.entries(itemExtraDefsSaved).map(([name, extraDef]) => ({ ...extraDef, name })),
    }
  }, [category])

  const [state, setState] = useState(calculateInitialState())

  const { itemExtraDefs } = state

  const updateItemExtraDefs = useCallback(
    (itemExtraDefsUpdated) => {
      setState((statePrev) => ({
        ...statePrev,
        itemExtraDefs: itemExtraDefsUpdated,
      }))
    },
    [setState]
  )

  const updateItemExtraDef = useCallback(
    ({ index, itemExtraDefUpdated }) => {
      const itemExtraDefsUpdated = [...itemExtraDefs]
      itemExtraDefsUpdated[index] = itemExtraDefUpdated
      updateItemExtraDefs(itemExtraDefsUpdated)
    },
    [updateItemExtraDefs]
  )

  const onAdd = useCallback(() => {
    updateItemExtraDefs([...itemExtraDefs, { name: '', dataType: Category.itemExtraDefDataTypes.text }])
  }, [itemExtraDefs, updateItemExtraDefs])

  const onItemDelete = useCallback(({ index }) => {
    const itemExtraDefsUpdated = ArrayUtils.removeItemAtIndex({ index })(itemExtraDefs)
    updateItemExtraDefs(itemExtraDefsUpdated)
  }, [])

  const onSave = useCallback(() => {
    const itemExtraDefsIndexed = itemExtraDefs.reduce(
      (acc, itemExtraDef) => ({
        ...acc,
        [itemExtraDef.name]: Category.newItemExtraDefItem({ dataType: itemExtraDef.dataType }),
      }),
      {}
    )
    Actions.updateCategoryProp({ key: Category.keysProps.itemExtraDef, value: itemExtraDefsIndexed })

    setState(calculateInitialState())
  }, [itemExtraDefs, setState, calculateInitialState])

  return (
    <PanelRight
      className="category-edit__extra-defs-editor"
      header={i18n.t('categoryEdit.extraProp', { count: 2 })}
      width="52rem"
      onClose={Actions.toggleEditExtraPropertiesPanel}
    >
      {itemExtraDefs.map((itemExtraDef, index) => {
        const { name, dataType } = itemExtraDef
        return (
          <FormItem label={`${i18n.t('categoryEdit.extraProp')} ${index + 1}`} key={String(index)}>
            <Input
              value={name}
              numberFormat={dataType === Category.itemExtraDefDataTypes.number ? NumberFormats.decimal() : null}
              readOnly={readOnly}
              onChange={(value) => {
                const valueNormalized = StringUtils.normalizeName(value)
                const itemExtraDefUpdated = { ...itemExtraDef, name: valueNormalized }
                updateItemExtraDef({ index, itemExtraDefUpdated })
              }}
            />
            <Dropdown
              readOnlyInput
              readOnly={readOnly}
              items={Object.keys(Category.itemExtraDefDataTypes)}
              itemKey={A.identity}
              itemLabel={(item) => i18n.t(`categoryEdit.extraPropDataType.${item}`)}
              selection={dataType}
              onChange={(dataTypeUpdated) =>
                updateItemExtraDef({ index, itemExtraDefUpdated: { ...itemExtraDef, dataType: dataTypeUpdated } })
              }
            />
            <ButtonDelete showLabel={false} onClick={() => onItemDelete({ index })} />
          </FormItem>
        )
      })}
      <div className="button-bar">
        <ButtonAdd onClick={onAdd} />
        <ButtonSave onClick={onSave} />
      </div>
    </PanelRight>
  )
}
