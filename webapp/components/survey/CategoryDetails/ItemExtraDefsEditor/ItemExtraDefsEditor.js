import './ItemExtraDefsEditor.scss'

import React, { useCallback, useState } from 'react'

import { ArrayUtils } from '@core/arrayUtils'
import * as Category from '@core/survey/category'
import { validateCategoryItemExtraDef } from '@core/survey/categoryItemExtraDefValidator'
import * as Validation from '@core/validation/validation'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { State, useActions } from '../store'
import { ButtonAdd, ButtonSave, PanelRight } from '@webapp/components'

import { ItemExtraDefEditor } from './ItemExtraDefEditor'

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
    async ({ index, itemExtraDefUpdated }) => {
      const itemExtraDefsUpdated = [...itemExtraDefs]
      const validation = await validateCategoryItemExtraDef({ itemExtraDef: itemExtraDefUpdated })
      itemExtraDefsUpdated[index] = Validation.assocValidation(validation)(itemExtraDefUpdated)
      updateItemExtraDefs(itemExtraDefsUpdated)
    },
    [updateItemExtraDefs]
  )

  const onAdd = useCallback(() => {
    const itemExtraDef = {
      ...Category.newItemExtraDefItem({ dataType: Category.itemExtraDefDataTypes.text }),
      name: '', // name property is used only in UI
    }
    const validation = await validateCategoryItemExtraDef({ itemExtraDef: itemExtraDefUpdated })
    const itemExtraDefValidated = Validation.assocValidation(validation)(itemExtraDef)
    updateItemExtraDefs([...itemExtraDefs, itemExtraDefValidated])
  }, [itemExtraDefs, updateItemExtraDefs])

  const onItemDelete = useCallback(
    ({ index }) => {
      const itemExtraDefsUpdated = ArrayUtils.removeItemAtIndex({ index })(itemExtraDefs)
      updateItemExtraDefs(itemExtraDefsUpdated)
    },
    [itemExtraDefs, updateItemExtraDefs]
  )

  const onSave = useCallback(() => {
    const itemExtraDefsIndexed = itemExtraDefs.reduce(
      (acc, itemExtraDef) => ({
        ...acc,
        [itemExtraDef.name]: Category.newItemExtraDefItem({ dataType: itemExtraDef.dataType }),
      }),
      {}
    )
    Actions.updateCategoryProp({ key: Category.keysProps.itemExtraDef, value: itemExtraDefsIndexed })
    Actions.toggleEditExtraPropertiesPanel()
  }, [itemExtraDefs, setState, calculateInitialState])

  return (
    <PanelRight
      className="category-edit__extra-defs-editor"
      header={i18n.t('categoryEdit.extraProp', { count: 2 })}
      width="52rem"
      onClose={Actions.toggleEditExtraPropertiesPanel}
    >
      <div className="items-container">
        {itemExtraDefs.map((itemExtraDef, index) => (
          <ItemExtraDefEditor
            key={String(index)}
            itemExtraDef={itemExtraDef}
            index={index}
            readOnly={readOnly}
            onItemDelete={onItemDelete}
            updateItemExtraDef={updateItemExtraDef}
          />
        ))}
      </div>
      <ButtonAdd className="item-add-btn" onClick={onAdd} />
      <ButtonSave className="save-btn" onClick={onSave} />
    </PanelRight>
  )
}
