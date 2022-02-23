import './itemDetails.scss'

import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'
import * as Validation from '@core/validation/validation'
import { normalizeName } from '@core/stringUtils'

import ErrorBadge from '@webapp/components/errorBadge'
import { FormItem, Input, NumberFormats } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { State, useActions } from '../../store'

const ItemDetails = (props) => {
  const { level, index, item, state, setState, style } = props

  const elemRef = useRef(null)

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
    if (active) {
      elemRef.current.scrollIntoView(false)
    }
  }, [active])

  const prefixId = `category-level-${levelIndex}-item-${index}`

  return (
    <div
      id={prefixId}
      data-testid={TestId.categoryDetails.item(levelIndex, index)}
      className={`category__item ${active ? 'active' : ''}`}
      onKeyDown={setActive}
      onClick={setActive}
      ref={elemRef}
      role="button"
      tabIndex={0}
      style={style}
    >
      <ErrorBadge
        id={TestId.categoryDetails.itemErrorBadge(levelIndex, index)}
        validation={validation}
        showLabel={false}
        showIcon
      />
      {active ? (
        <>
          <button
            id={`${prefixId}-btn-close`}
            data-testid={TestId.categoryDetails.itemCloseBtn(levelIndex, index)}
            type="button"
            className="btn btn-s btn-close"
            onClick={() => Actions.resetItemActive({ levelIndex })}
          >
            <span className="icon icon-arrow-up icon-12px" />
          </button>

          <FormItem label={i18n.t('common.code')}>
            <Input
              id={TestId.categoryDetails.itemCode(levelIndex, index)}
              value={CategoryItem.getCode(item)}
              disabled={disabled}
              validation={Validation.getFieldValidation(CategoryItem.keysProps.code)(validation)}
              onChange={(value) => updateProp({ key: CategoryItem.keysProps.code, value: normalizeName(value) })}
              readOnly={readOnly}
            />
          </FormItem>

          <LabelsEditor
            inputFieldIdPrefix={TestId.categoryDetails.itemLabel(levelIndex, index)('')}
            labels={CategoryItem.getLabels(item)}
            onChange={(labels) => updateProp({ key: CategoryItem.keysProps.labels, value: labels })}
            readOnly={readOnly}
          />

          {extraPropsEditorVisible && (
            <fieldset className="extra-props">
              <legend>{i18n.t('categoryEdit.extraProp', { count: 2 })}</legend>
              {Object.entries(itemExtraDefs).map(([key, { dataType }]) => (
                <FormItem label={key} key={key}>
                  <Input
                    value={CategoryItem.getExtraProp(key)(item)}
                    numberFormat={dataType === CategoryItemExtraDef.dataTypes.number ? NumberFormats.decimal() : null}
                    readOnly={readOnly}
                    validation={Validation.getFieldValidation(`${CategoryItem.keysProps.extra}_${key}`)(validation)}
                    onChange={(value) => {
                      const extra = R.pipe(CategoryItem.getExtra, R.assoc(key, value))(item)
                      updateProp({ key: CategoryItem.keysProps.extra, value: extra })
                    }}
                  />
                </FormItem>
              ))}
            </fieldset>
          )}

          {!readOnly && (
            <button
              type="button"
              className="btn btn-delete"
              data-testid={TestId.categoryDetails.itemDeleteBtn(levelIndex, index)}
              aria-disabled={disabled}
              onClick={() => Actions.deleteItem({ category, level, item, leaf })}
            >
              <span className="icon icon-bin2 icon-12px icon-left" />
              {i18n.t('categoryEdit.deleteItem')}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="ellipsis">{CategoryItem.getCode(item)}</div>
          <div className="ellipsis">
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
