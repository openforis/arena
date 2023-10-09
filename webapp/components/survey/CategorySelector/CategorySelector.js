import './CategorySelector.scss'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import * as API from '@webapp/service/api'
import { TestId } from '@webapp/utils/testId'

import { useNotifyWarning } from '@webapp/components/hooks'
import { ButtonIconEdit, ButtonManage } from '@webapp/components/buttons'
import Dropdown from '@webapp/components/form/Dropdown'
import PanelRight from '@webapp/components/PanelRight'
import CategoryList from '@webapp/components/survey/CategoryList'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'

export const CategorySelector = (props) => {
  const {
    disabled,
    categoryUuid,
    validation,
    onChange,
    onCategoryLoad,
    filterFunction,
    emptySelection,
    showAdd,
    showEdit,
    showManage,
  } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const notifyWarning = useNotifyWarning()

  const [category, setCategory] = useState({})
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState(null)

  const emptyItem = useMemo(() => ({ uuid: null, label: i18n.t('common.notSpecified') }), [])

  const categoriesLookupFunction = useCallback(
    async (value) => {
      if (showCategoriesPanel || categoryToEdit) return []

      const categories = await API.fetchCategories({ surveyId, search: value })
      const filteredCategories = filterFunction ? categories.filter(filterFunction) : categories
      return emptySelection ? [emptyItem, ...filteredCategories] : filteredCategories
    },
    // force dropdown items to reload when edit panel is closed
    [filterFunction, surveyId, emptySelection, emptyItem, showCategoriesPanel, categoryToEdit]
  )

  useEffect(() => {
    ;(async () => {
      if (!A.isEmpty(categoryUuid)) {
        const categorySelected = await API.fetchCategory({ surveyId, categoryUuid })
        setCategory(categorySelected)
        onCategoryLoad(categorySelected)
      } else {
        setCategory(null)
      }
    })()
  }, [categoryUuid, showCategoriesPanel, onCategoryLoad, setCategory, surveyId])

  const onCategoryUpdate = useCallback(
    ({ category: categoryUpdated }) => {
      setCategoryToEdit(categoryUpdated)
    },
    [setCategoryToEdit]
  )

  const checkEditCategoryNameSpecified = useCallback(() => {
    if (StringUtils.isBlank(Category.getName(categoryToEdit))) {
      notifyWarning({ key: 'validationErrors.categoryEdit.nameNotSpecified', timeout: 2000 })
      return false
    }
    return true
  }, [surveyId, categoryToEdit, notifyWarning])

  const onCategoryEditPanelClose = useCallback(async () => {
    const categoryEditedUuid = Category.getUuid(categoryToEdit)
    const { deleted } = await API.cleanupCategory({ surveyId, categoryUuid: categoryEditedUuid })
    if (deleted) {
      if (categoryUuid === categoryEditedUuid) {
        // previously selected category has been deleted, deselect it from dropdown
        onChange(null)
      }
      // close edit panel
      setCategoryToEdit(null)
    } else if (checkEditCategoryNameSpecified()) {
      // update category dropdown with latest changes
      onChange(categoryToEdit)
      // close edit panel
      setCategoryToEdit(null)
    }
  }, [categoryUuid, categoryToEdit, onChange, surveyId, setCategoryToEdit, checkEditCategoryNameSpecified])

  return (
    <div className="category-selector">
      <Dropdown
        testId={TestId.categorySelector.dropdown}
        disabled={disabled}
        items={categoriesLookupFunction}
        itemValue={Category.keys.uuid}
        itemLabel={(item) => (item.uuid ? Category.getName(item) : emptyItem.label)}
        validation={validation}
        selection={category}
        onChange={onChange}
      />

      {showEdit && category && <ButtonIconEdit onClick={() => setCategoryToEdit(category)} size="small" showLabel />}

      {showAdd && !disabled && (
        <ButtonMetaItemAdd
          id={TestId.categorySelector.addCategoryBtn}
          onAdd={setCategoryToEdit}
          metaItemType={metaItemTypes.category}
        />
      )}
      {showManage && <ButtonManage size="small" onClick={() => setShowCategoriesPanel(true)} />}
      {showCategoriesPanel && !categoryToEdit && (
        <PanelRight
          width="100vw"
          onClose={() => setShowCategoriesPanel(false)}
          header={i18n.t('appModules.categories')}
        >
          <CategoryList
            canSelect={!disabled}
            selectedItemUuid={categoryUuid}
            onSelect={onChange}
            onCategoryCreated={setCategoryToEdit}
            onCategoryOpen={setCategoryToEdit}
          />
        </PanelRight>
      )}
      {categoryToEdit && (
        <PanelRight width="100vw" onClose={onCategoryEditPanelClose} header={i18n.t('categoryEdit.header')} showFooter>
          <CategoryDetails
            categoryUuid={Category.getUuid(categoryToEdit)}
            onCategoryUpdate={onCategoryUpdate}
            showClose={false}
          />
        </PanelRight>
      )}
    </div>
  )
}

CategorySelector.propTypes = {
  categoryUuid: PropTypes.string,
  validation: PropTypes.object,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  onCategoryLoad: PropTypes.func,
  filterFunction: PropTypes.func,
  emptySelection: PropTypes.bool,
  showAdd: PropTypes.bool,
  showEdit: PropTypes.bool,
  showManage: PropTypes.bool,
}

CategorySelector.defaultProps = {
  categoryUuid: null, // Selected categoryUuid
  validation: null,
  disabled: false,
  onChange: () => ({}),
  onCategoryLoad: () => ({}),
  filterFunction: null,
  emptySelection: false,
  showAdd: true,
  showEdit: true,
  showManage: true,
}
