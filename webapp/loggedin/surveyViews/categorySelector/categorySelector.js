import './categorySelector.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useHistory } from 'react-router-dom'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'

import { useI18n } from '@webapp/components/hooks'
import Dropdown from '@webapp/components/form/dropdown'

import { appModuleUri, designerModules, analysisModules } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'

import { createCategory } from '@webapp/loggedin/surveyViews/category/actions'

const CategorySelector = props => {
  const { disabled, categoryUuid, validation, showManage, showAdd, analysis, onChange } = props

  const i18n = useI18n()

  const dispatch = useDispatch()
  const history = useHistory()
  const survey = useSelector(SurveyState.getSurvey)
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
          className="btn btn-s"
          style={{ justifySelf: 'center' }}
          onClick={async () => {
            const category = await dispatch(createCategory(history, analysis))
            onChange(category)
          }}
          aria-disabled={disabled}
        >
          <span className="icon icon-plus icon-12px icon-left" />
          {i18n.t('common.add')}
        </button>
      )}
      {showManage && (
        <Link
          className="btn btn-s"
          style={{ justifySelf: 'center' }}
          to={appModuleUri(analysis ? analysisModules.categories : designerModules.categories)}
        >
          <span className="icon icon-list icon-12px icon-left" />
          {i18n.t('common.manage')}
        </Link>
      )}
    </div>
  )
}

CategorySelector.defaultProps = {
  categoryUuid: null, // Selected categoryUuid
  validation: null,
  disabled: false,
  showManage: true,
  showAdd: true,
  analysis: false, // True if used inside analysis/nodeDef editor
  onChange: () => ({}),
}

export default CategorySelector
