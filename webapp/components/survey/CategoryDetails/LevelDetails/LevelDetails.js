import React from 'react'
import PropTypes from 'prop-types'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'

import { FormItem, Input } from '@webapp/components/form/Input'
import ErrorBadge from '@webapp/components/errorBadge'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import ItemDetails from './ItemDetails'

import { State, useActions } from '../store'

const LevelDetails = (props) => {
  const { level, state, setState } = props

  const readOnly = !useAuthCanEditSurvey()
  const i18n = useI18n()

  const Actions = useActions({ setState })

  const category = State.getCategory(state)
  const levelIndex = CategoryLevel.getIndex(level)
  const canBeDeleted = Category.isLevelDeleteAllowed(level)(category)
  const parentItem = State.getItemActive({ levelIndex: levelIndex - 1 })(state)
  const canAddItem = levelIndex === 0 || parentItem
  const items = canAddItem ? State.getItemsArray({ levelIndex })(state) : []
  const validation = Category.getLevelValidation(levelIndex)(category)

  return (
    <div id={`category-level-${levelIndex}`} className="category__level">
      <div className="category__level-header">
        <h4 className="label">
          <ErrorBadge validation={validation} showLabel={false} showIcon />
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
          id={`category-level-${levelIndex}-name`}
          value={CategoryLevel.getName(level)}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={(value) =>
            Actions.updateLevelProp({ category, level, key: 'name', value: StringUtils.normalizeName(value) })
          }
          readOnly={readOnly}
        />
      </FormItem>

      <div className="category__level-items-header">
        <h5 className="label">{i18n.t('common.item_plural')}</h5>
        {!readOnly && (
          <button
            id={`category-level-${levelIndex}-btn-item-add`}
            type="button"
            className="btn btn-s btn-add-item"
            aria-disabled={!canAddItem}
            onClick={() => Actions.createItem({ category, level, parentItemUuid: CategoryItem.getUuid(parentItem) })}
          >
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('common.add')}
          </button>
        )}
      </div>

      <div className="category__level-items">
        {items.map((item, index) => (
          <ItemDetails
            key={CategoryItem.getUuid(item)}
            level={level}
            index={index}
            item={item}
            state={state}
            setState={setState}
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
