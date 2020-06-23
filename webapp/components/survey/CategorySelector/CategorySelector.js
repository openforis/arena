import './CategorySelector.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/dropdown'

import { useSurvey } from '@webapp/store/survey'

import { createCategory, openCategoriesManager } from '@webapp/loggedin/surveyViews/category/actions'

const CategorySelector = (props) => {
  const { disabled, categoryUuid, validation, showManage, showAdd, analysis, nodeDefState, onChange } = props

  const i18n = useI18n()

  const dispatch = useDispatch()
  const history = useHistory()
  const survey = useSurvey()
  const categories = Survey.getCategoriesArray(survey)
  const category = Survey.getCategoryByUuid(categoryUuid)(survey)

  return (
    <div className="category-selector">
      <Dropdown
        disabled={disabled}
        items={categories}
        itemKeyProp={Category.keys.uuid}
        itemLabelFunction={Category.getName}
        validation={validation}
        selection={category}
        onChange={onChange}
      />
      {showAdd && (
        <button
          type="button"
          className="btn btn-s"
          style={{ justifySelf: 'center' }}
          onClick={async () => {
            const newCategory = await dispatch(createCategory(history, analysis, nodeDefState))
            onChange(newCategory)
          }}
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
          onClick={() => dispatch(openCategoriesManager({ history, analysis, nodeDefState }))}
          aria-disabled={disabled}
        >
          <span className="icon icon-list icon-12px icon-left" />
          {i18n.t('common.manage')}
        </button>
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
  analysis: PropTypes.bool,
  nodeDefState: PropTypes.object,
  onChange: PropTypes.func,
}

CategorySelector.defaultProps = {
  categoryUuid: null, // Selected categoryUuid
  validation: null,
  disabled: false,
  showManage: true,
  showAdd: true,
  analysis: false, // True if used inside analysis/nodeDef editor
  nodeDefState: null,
  onChange: () => ({}),
}

export default CategorySelector
