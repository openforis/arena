import './CategorySelector.scss'

import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'
import * as API from '@webapp/service/api'
import { TestId } from '@webapp/utils/testId'

import { useNotifyWarning } from '@webapp/components/hooks'
import Dropdown from '@webapp/components/form/Dropdown'
import PanelRight from '@webapp/components/PanelRight'
import CategoryList from '@webapp/components/survey/CategoryList'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'
import ButtonMetaItemAdd, { metaItemTypes } from '@webapp/components/survey/ButtonMetaItemAdd'

const CategorySelector = (props) => {
  const {
    disabled,
    categoryUuid,
    validation,
    showManage,
    showAdd,
    onChange,
    onCategoryLoad,
    filterFunction,
    emptySelection,
  } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const notifyWarning = useNotifyWarning()

  const [category, setCategory] = useState({})
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState(null)

  const emptyItem = { uuid: null, label: i18n.t('common.notSpecified') }

  const categoriesLookupFunction = async (value) => {
    const categories = await API.fetchCategories({ surveyId, search: value })
    const filteredCategories = filterFunction ? categories.filter(filterFunction) : categories
    return emptySelection ? [emptyItem, ...filteredCategories] : filteredCategories
  }

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

  const checkEditCategoryNameSpecified = async () => {
    const reloadedCategory = await API.fetchCategory({ surveyId, categoryUuid: categoryToEdit.uuid, draft: true })
    if (StringUtils.isBlank(Category.getName(reloadedCategory))) {
      notifyWarning({ key: 'validationErrors.categoryEdit.nameNotSpecified', timeout: 2000 })
      return false
    }
    return true
  }

  const onCategoryEditPanelClose = useCallback(async () => {
    const categoryEditedUuid = categoryToEdit.uuid
    const { deleted } = await API.cleanupCategory({ surveyId, categoryUuid: categoryEditedUuid })
    if (deleted) {
      if (categoryUuid === categoryEditedUuid) {
        // previously selected category has been deleted, deselect it from dropdown
        onChange(null)
      }
      // close edit panel
      setCategoryToEdit(null)
      return
    }
    if (await checkEditCategoryNameSpecified()) {
      // update category dropdown with latest changes
      onChange(categoryToEdit)
      // close edit panel
      setCategoryToEdit(null)
    }
  }, [categoryUuid, categoryToEdit, onChange, surveyId, setCategoryToEdit, checkEditCategoryNameSpecified])

  return (
    <div className="category-selector">
      <Dropdown
        idInput={TestId.categorySelector.category}
        disabled={disabled}
        items={categoriesLookupFunction}
        itemKey={Category.keys.uuid}
        itemLabel={(item) => (item.uuid ? Category.getName(item) : emptyItem.label)}
        validation={validation}
        selection={category}
        onChange={onChange}
      />
      {showAdd && (
        <ButtonMetaItemAdd
          id={TestId.categorySelector.addCategoryBtn}
          onAdd={setCategoryToEdit}
          metaItemType={metaItemTypes.category}
        />
      )}
      {showManage && (
        <button
          type="button"
          className="btn btn-s"
          style={{ justifySelf: 'center' }}
          onClick={() => setShowCategoriesPanel(true)}
        >
          <span className="icon icon-list icon-12px icon-left" />
          {i18n.t('common.manage')}
        </button>
      )}
      {showCategoriesPanel && !categoryToEdit && (
        <PanelRight
          width="100vw"
          onClose={() => setShowCategoriesPanel(false)}
          header={i18n.t('appModules.categories')}
        >
          <CategoryList
            canSelect
            selectedItemUuid={categoryUuid}
            onSelect={onChange}
            onCategoryCreated={setCategoryToEdit}
            onCategoryOpen={setCategoryToEdit}
          />
        </PanelRight>
      )}
      {categoryToEdit && (
        <PanelRight width="100vw" onClose={onCategoryEditPanelClose} header={i18n.t('categoryEdit.header')}>
          <CategoryDetails categoryUuid={Category.getUuid(categoryToEdit)} showClose={false} />
        </PanelRight>
      )}
    </div>
  )
}

CategorySelector.propTypes = {
  categoryUuid: PropTypes.string,
  validation: PropTypes.object,
  disabled: PropTypes.bool,
  showManage: PropTypes.bool,
  showAdd: PropTypes.bool,
  onChange: PropTypes.func,
  onCategoryLoad: PropTypes.func,
  filterFunction: PropTypes.func,
  emptySelection: PropTypes.bool,
}

CategorySelector.defaultProps = {
  categoryUuid: null, // Selected categoryUuid
  validation: null,
  disabled: false,
  showManage: true,
  showAdd: true,
  onChange: () => ({}),
  onCategoryLoad: () => ({}),
  filterFunction: null,
  emptySelection: false,
}

export default CategorySelector
