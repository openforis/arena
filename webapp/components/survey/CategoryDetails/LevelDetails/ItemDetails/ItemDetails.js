import './itemDetails.scss'

import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'

import { Button, ButtonDelete } from '@webapp/components'
import ErrorBadge from '@webapp/components/errorBadge'
import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { State, useActions } from '../../store'
import classNames from 'classnames'
import { ItemExtraPropsEditor } from './ItemExtraPropsEditor'

const ItemDetails = (props) => {
  const { level, index, item, state, setState } = props

  const elemRef = useRef(null)
  const isInitialMount = useRef(true)

  const i18n = useI18n()
  const readOnly = !useAuthCanEditSurvey()
  const lang = useSurveyPreferredLang()

  const category = State.getCategory(state)
  const categoryUuid = Category.getUuid(category)
  const itemExtraDefs = Category.getItemExtraDef(category)
  const validation = Category.getItemValidation(item)(category)
  const { published: disabled } = item

  const levelIndex = CategoryLevel.getIndex(level)
  const levelIsLast = levelIndex === Category.getLevelsArray(category).length - 1
  const itemActive = State.getItemActive({ levelIndex })(state)
  const itemActiveUuid = itemActive ? CategoryItem.getUuid(itemActive) : null
  const itemUuid = CategoryItem.getUuid(item)
  const active = itemUuid === itemActiveUuid
  const leaf = active && State.isItemActiveLeaf({ levelIndex })(state)
  const extraPropsEditorVisible =
    !R.isEmpty(itemExtraDefs) &&
    (levelIsLast || !Category.isReportingData(category) || Object.entries(itemExtraDefs).length > 1)

  const Actions = useActions({ setState })

  const setActive = () => (active ? null : Actions.setItemActive({ categoryUuid, levelIndex, itemUuid }))

  const updateProp = ({ key, value }) => Actions.updateItemProp({ categoryUuid, levelIndex, itemUuid, key, value })

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (active) {
        elemRef.current.scrollIntoView(false)
      }
    }
  }, [active])

  const prefixId = `category-level-${levelIndex}-item-${index}`

  return (
    <div
      id={prefixId}
      data-testid={TestId.categoryDetails.item(levelIndex, index)}
      className={classNames('category__item', { active, 'not-valid': !Validation.isValid(validation) })}
      key={CategoryItem.getUuid(item)}
      onKeyDown={setActive}
      onClick={setActive}
      ref={elemRef}
      role="button"
      tabIndex={0}
    >
      <ErrorBadge
        id={TestId.categoryDetails.itemErrorBadge(levelIndex, index)}
        validation={validation}
        showLabel={false}
        showIcon
      />
      {active ? (
        <>
          <Button
            id={`${prefixId}-btn-close`}
            testId={TestId.categoryDetails.itemCloseBtn(levelIndex, index)}
            className="btn-s btn-close"
            iconClassName="icon-arrow-up icon-12px"
            onClick={() => Actions.resetItemActive({ levelIndex })}
          />

          <FormItem label={i18n.t('common.code')}>
            <Input
              id={TestId.categoryDetails.itemCode(levelIndex, index)}
              value={CategoryItem.getCode(item)}
              disabled={disabled}
              validation={Validation.getFieldValidation(CategoryItem.keysProps.code)(validation)}
              onChange={(value) =>
                updateProp({ key: CategoryItem.keysProps.code, value: CategoryItem.normalizeCode(value) })
              }
              readOnly={readOnly}
            />
          </FormItem>

          <LabelsEditor
            inputFieldIdPrefix={TestId.categoryDetails.itemLabelPrefix(levelIndex, index)}
            labels={CategoryItem.getLabels(item)}
            onChange={(labels) => updateProp({ key: CategoryItem.keysProps.labels, value: labels })}
            readOnly={readOnly}
          />

          <LabelsEditor
            formLabelKey="common.description"
            inputFieldIdPrefix={TestId.categoryDetails.itemDescriptionPrefix(levelIndex, index)}
            inputType="textarea"
            labels={CategoryItem.getDescriptions(item)}
            onChange={(descriptions) => updateProp({ key: CategoryItem.keysProps.descriptions, value: descriptions })}
            readOnly={readOnly}
          />

          {extraPropsEditorVisible && (
            <ItemExtraPropsEditor
              item={item}
              itemExtraDefs={itemExtraDefs}
              readOnly={readOnly}
              updateProp={updateProp}
              validation={validation}
            />
          )}

          {!readOnly && (
            <ButtonDelete
              testId={TestId.categoryDetails.itemDeleteBtn(levelIndex, index)}
              disabled={disabled}
              onClick={() => Actions.deleteItem({ category, level, item, leaf })}
              label="categoryEdit.deleteItem"
            />
          )}
        </>
      ) : (
        <>
          <div className="ellipsis">{CategoryItem.getCode(item)}</div>
          <div>
            {'\u00A0'}-{'\u00A0'}
          </div>
          <div className="ellipsis">{CategoryItem.getLabel(lang)(item)}</div>
        </>
      )}
    </div>
  )
}

ItemDetails.propTypes = {
  level: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

export default ItemDetails
