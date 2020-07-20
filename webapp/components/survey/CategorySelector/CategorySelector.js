import './CategorySelector.scss'

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import * as Category from '@core/survey/category'

import { useI18n } from '@webapp/store/system'
import { useSurveyId } from '@webapp/store/survey'

import * as API from '@webapp/service/api'

import Dropdown from '@webapp/components/form/Dropdown'
import PanelRight from '@webapp/components/PanelRight'
import CategoryList from '@webapp/components/survey/CategoryList'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'

const CategorySelector = (props) => {
  const { disabled, categoryUuid, validation, showManage, showAdd, onChange } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()

  const [category, setCategory] = useState({})
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false)
  const [showCategoryPanel, setShowCategoryPanel] = useState(false)
  const [categoryUuidToEdit, setCategoryUuidToEdit] = useState(null)

  const categoriesLookupFunction = async (value) => API.fetchCategories({ surveyId, search: value })

  useEffect(() => {
    ;(async () => {
      if (!A.isEmpty(categoryUuid)) {
        const categorySelected = await API.fetchCategory({ surveyId, uuid: categoryUuid })
        setCategory(categorySelected)
      }
    })()
  }, [categoryUuid])

  return (
    <div className="category-selector">
      <Dropdown
        disabled={disabled}
        items={categoriesLookupFunction}
        itemKey={Category.keys.uuid}
        itemLabel={Category.getName}
        validation={validation}
        selection={category}
        onChange={onChange}
      />
      {showAdd && (
        <button
          type="button"
          className="btn btn-s"
          style={{ justifySelf: 'center' }}
          onClick={() => setShowCategoryPanel(true)}
          aria-disabled={disabled}
        >
          <span className="icon icon-plus icon-12px icon-left" />
          {i18n.t('common.add')}
        </button>
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
      {showCategoriesPanel && !showCategoryPanel && (
        <PanelRight
          width="100vw"
          onClose={() => setShowCategoriesPanel(false)}
          header={i18n.t('appModules.categories')}
        >
          <CategoryList
            canSelect
            selectedItemUuid={categoryUuid}
            onAdd={() => setShowCategoryPanel(true)}
            onSelect={onChange}
            onEdit={(categoryToEditSelected) => {
              setCategoryUuidToEdit(Category.getUuid(categoryToEditSelected))
              setShowCategoryPanel(true)
            }}
          />
        </PanelRight>
      )}
      {showCategoryPanel && (
        <PanelRight
          width="100vw"
          onClose={() => {
            setShowCategoryPanel(false)
            setCategoryUuidToEdit(null)
          }}
          header={i18n.t('categoryEdit.header')}
        >
          <CategoryDetails categoryUuid={categoryUuidToEdit} onCategoryCreated={onChange} showClose={false} />
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
}

CategorySelector.defaultProps = {
  categoryUuid: null, // Selected categoryUuid
  validation: null,
  disabled: false,
  showManage: true,
  showAdd: true,
  onChange: () => ({}),
}

export default CategorySelector
