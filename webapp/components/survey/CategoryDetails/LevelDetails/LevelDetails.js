import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'

import { FormItem, Input } from '@webapp/components/form/Input'
import ErrorBadge from '@webapp/components/errorBadge'
import { Button } from '@webapp/components'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { State, useActions } from '../store'
import { ItemsList } from './ItemsList'

const LevelDetails = (props) => {
  const { level, single, state, setState } = props

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

  const nameReadOnly = readOnly || Category.isReportingData(category)

  return (
    <div
      id={`category-level-${levelIndex}`}
      className={classNames('category__level', { single })}
      data-testid={TestId.categoryDetails.level(levelIndex)}
    >
      <ErrorBadge
        id={TestId.categoryDetails.levelErrorBadge(levelIndex)}
        validation={validation}
        showLabel={false}
        showIcon
      />
      {!single && (
        <>
          <div className="category__level-header">
            <h4 className="label">
              {i18n.t('categoryEdit.level')} {levelIndex + 1}
            </h4>
            {!readOnly && canBeDeleted && (
              <Button
                size="small"
                testId={TestId.categoryDetails.levelDeleteBtn(levelIndex)}
                onClick={() => Actions.deleteLevel({ category, level })}
                iconClassName="icon-bin2 icon-12px"
              />
            )}
          </div>

          <FormItem label={i18n.t('common.name')}>
            <Input
              id={TestId.categoryDetails.levelName(levelIndex)}
              value={CategoryLevel.getName(level)}
              validation={Validation.getFieldValidation('name')(validation)}
              onChange={(value) =>
                Actions.updateLevelProp({ category, level, key: 'name', value: StringUtils.normalizeName(value) })
              }
              readOnly={nameReadOnly}
            />
          </FormItem>
        </>
      )}

      <div className="category__level-items-header">
        <h5 className="label">{i18n.t('common.item_plural')}</h5>
        {!readOnly && (
          <Button
            id={`category-level-${levelIndex}-btn-item-add`}
            testId={TestId.categoryDetails.levelAddItemBtn(levelIndex)}
            className="btn-s btn-add-item"
            disabled={!canAddItem}
            onClick={() => Actions.createItem({ category, level, parentItemUuid: CategoryItem.getUuid(parentItem) })}
            iconClassName="icon-plus icon-12px"
            label="common.add"
          />
        )}
      </div>

      <ItemsList items={items} level={level} state={state} setState={setState} />
    </div>
  )
}

LevelDetails.propTypes = {
  level: PropTypes.object.isRequired,
  single: PropTypes.bool,
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

LevelDetails.defaultProps = {
  single: false,
}

export default LevelDetails
