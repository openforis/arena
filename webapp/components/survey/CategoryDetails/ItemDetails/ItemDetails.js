import React, { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Category from '@core/survey/category'
import * as CategoryLevel from '@core/survey/categoryLevel'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import { normalizeName } from '@core/stringUtils'

import ErrorBadge from '@webapp/components/errorBadge'
import { FormItem, Input } from '@webapp/components/form/input'
import * as InputMasks from '@webapp/components/form/inputMasks'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'

import { State, useActions } from '../store'

const ItemDetails = (props) => {
  const { level, item, state, setState } = props

  const elemRef = useRef(null)

  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const readOnly = !useAuthCanEditSurvey()

  const lang = Survey.getLanguage(i18n.lang)(surveyInfo)
  const category = State.getCategory(state)
  const categoryUuid = Category.getUuid(category)
  const itemExtraDefs = Category.getItemExtraDef(category)
  const validation = Category.getItemValidation(item)(category)
  const { published: disabled } = item

  const levelIndex = CategoryLevel.getIndex(level)
  const activeItem = State.getLevelActiveItem({ levelIndex })(state)
  const activeItemUuid = activeItem ? CategoryItem.getUuid(activeItem) : null
  const itemUuid = CategoryItem.getUuid(item)
  const active = itemUuid === activeItemUuid
  const leaf = active && State.isLevelActiveItemLeaf({ levelIndex })(state)

  const Actions = useActions({ setState })

  const setActive = () => (active ? null : Actions.setItemActive({ categoryUuid, levelIndex, itemUuid }))

  const updateProp = ({ key, value }) => Actions.updateItemProp({ categoryUuid, levelIndex, itemUuid, key, value })

  useEffect(() => {
    if (active) {
      elemRef.current.scrollIntoView(false)
    }
  }, [active])

  return (
    <div
      className={`category__item ${active ? 'active' : ''}`}
      onKeyDown={setActive}
      onClick={setActive}
      ref={elemRef}
      role="button"
      tabIndex={0}
    >
      <ErrorBadge validation={validation} showLabel={false} />
      {active ? (
        <>
          <button type="button" className="btn btn-s btn-close" onClick={() => Actions.resetItemActive({ levelIndex })}>
            <span className="icon icon-arrow-up icon-12px" />
          </button>

          <FormItem label={i18n.t('common.code')}>
            <Input
              value={CategoryItem.getCode(item)}
              disabled={disabled}
              validation={Validation.getFieldValidation(CategoryItem.keysProps.code)(validation)}
              onChange={(value) => updateProp({ key: CategoryItem.keysProps.code, value: normalizeName(value) })}
              readOnly={readOnly}
            />
          </FormItem>

          <LabelsEditor
            labels={CategoryItem.getLabels(item)}
            onChange={(labels) => updateProp({ key: CategoryItem.keysProps.labels, value: labels })}
            readOnly={readOnly}
          />

          {Object.entries(itemExtraDefs).map(([key, { dataType }]) => (
            <FormItem label={key} key={key}>
              <Input
                value={CategoryItem.getExtraProp(key)(item)}
                mask={dataType === Category.itemExtraDefDataTypes.number ? InputMasks.decimal : null}
                readOnly={readOnly}
                validation={Validation.getFieldValidation(`${CategoryItem.keysProps.extra}_${key}`)(validation)}
                onChange={(value) => {
                  const extra = R.pipe(CategoryItem.getExtra, R.assoc(key, value))(item)
                  updateProp({ key: CategoryItem.keysProps.extra, value: extra })
                }}
              />
            </FormItem>
          ))}

          {!readOnly && (
            <button
              type="button"
              className="btn btn-delete"
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
  item: PropTypes.object.isRequired,
  state: PropTypes.object.isRequired,
  setState: PropTypes.func.isRequired,
}

export default ItemDetails
