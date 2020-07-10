import './CategorySelector.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import Dropdown from '@webapp/components/form/Dropdown'
import PanelRight from '@webapp/components/PanelRight'
import CategoryList from '@webapp/views/App/views/Designer/CategoryList'
import CategoryDetails from '@webapp/components/survey/CategoryDetails'

import * as CategoryState from '@webapp/loggedin/surveyViews/category/categoryState'
import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

const CategorySelector = (props) => {
  const { disabled, categoryUuid, validation, showManage, showAdd, onChange } = props

  const i18n = useI18n()

  const dispatch = useDispatch()

  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false)

  const survey = useSurvey()
  const categories = Survey.getCategoriesArray(survey)
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)
  const editedCategory = useSelector(CategoryState.getCategoryForEdit)

  const onAdd = async () => {
    const newCategory = await dispatch(CategoryActions.createCategory())
    onChange(newCategory)
  }

  return (
    <div className="category-selector">
      <Dropdown
        disabled={disabled}
        items={categories}
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
          onClick={onAdd}
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
      {showCategoriesPanel && !editedCategory && (
        <PanelRight
          width="100vw"
          onClose={() => setShowCategoriesPanel(false)}
          header={i18n.t('appModules.categories')}
        >
          <CategoryList canSelect selectedItemUuid={categoryUuid} onSelect={onChange} />
        </PanelRight>
      )}
      {editedCategory && (
        <PanelRight
          width="100vw"
          onClose={async () => {
            await dispatch(CategoryActions.setCategoryForEdit(null))
          }}
          header={i18n.t('categoryEdit.header')}
        >
          <CategoryDetails showClose={false} />
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
