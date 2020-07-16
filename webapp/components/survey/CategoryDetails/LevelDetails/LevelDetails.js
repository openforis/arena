import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import { normalizeName } from '@core/stringUtils'

import { FormItem, Input } from '@webapp/components/form/input'
import ErrorBadge from '@webapp/components/errorBadge'

import { useSurvey } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import {
  createCategoryLevelItem,
  putCategoryItemProp,
  deleteCategoryItem,
  setCategoryItemForEdit,
} from '@webapp/loggedin/surveyViews/category/actions'

import ItemEdit from '../ItemEdit'

import { State, useActions } from '../store'

const LevelDetails = (props) => {
  const { level, state, setState } = props
  const index = CategoryLevel.getIndex(level)

  const readOnly = !useAuthCanEditSurvey()

  const i18n = useI18n()
  const survey = useSurvey()
  const surveyInfo = Survey.getSurveyInfo(survey)
  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)

  const Actions = useActions({ setState })

  const category = State.getCategory(state)
  const activeItem = State.getLevelActiveItem(index)(state)
  const activeItemUuid = activeItem ? CategoryItem.getUuid(activeItem) : null
  const parentItem = State.getLevelActiveItem(index - 1)(state)

  const canAddItem = index === 0 || parentItem
  const items = canAddItem ? State.getLevelItemsArray(index)(state) : []
  const canBeDeleted = Category.isLevelDeleteAllowed(level)(category)

  const validation = Category.getLevelValidation(index)(category)

  return (
    <div className="category__level">
      <div className="category__level-header">
        <h4 className="label">
          <ErrorBadge validation={validation} />
          {i18n.t('categoryEdit.level')} {level.index + 1}
        </h4>
        {!readOnly && (
          <button
            type="button"
            className="btn btn-s"
            onClick={() => Actions.deleteLevel({ category, level })}
            aria-disabled={!canBeDeleted}
          >
            <span className="icon icon-bin2 icon-12px" />
          </button>
        )}
      </div>

      <FormItem label={i18n.t('common.name')}>
        <Input
          value={CategoryLevel.getName(level)}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={(value) => Actions.updateLevelProp({ category, level, key: 'name', value: normalizeName(value) })}
          readOnly={readOnly}
        />
      </FormItem>

      <div className="category__level-items-header">
        <h5 className="label">{i18n.t('common.item_plural')}</h5>
        {!readOnly && (
          <button
            type="button"
            className="btn btn-s btn-add-item"
            aria-disabled={!canAddItem}
            onClick={() => createCategoryLevelItem(category, level, parentItem)}
          >
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
        )}
      </div>

      <div className="category__level-items">
        {items.map((item) => (
          <ItemEdit
            key={CategoryItem.getUuid(item)}
            lang={lang}
            category={category}
            level={level}
            item={item}
            active={CategoryItem.getUuid(item) === activeItemUuid}
            putCategoryItemProp={putCategoryItemProp}
            setCategoryItemForEdit={setCategoryItemForEdit}
            deleteCategoryItem={deleteCategoryItem}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

LevelDetails.propTypes = {
  level: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

export default LevelDetails
