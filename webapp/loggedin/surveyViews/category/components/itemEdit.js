import React, { useEffect, useRef } from 'react'
import * as R from 'ramda'

import * as Category from '@core/survey/category'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import { normalizeName } from '@core/stringUtils'

import { useI18n } from '@webapp/store/system'
import ErrorBadge from '@webapp/components/errorBadge'
import { FormItem, Input } from '@webapp/components/form/input'
import * as InputMasks from '@webapp/components/form/inputMasks'

import LabelsEditor from '@webapp/components/survey/LabelsEditor'

const ItemEdit = props => {
  const elemRef = useRef(null)

  useEffect(() => {
    if (props.active) {
      elemRef.current.scrollIntoView(false)
    }
  }, [props.active])

  const {
    category,
    level,
    item,
    active,
    putCategoryItemProp,
    setCategoryItemForEdit,
    deleteCategoryItem,
    lang,
    readOnly,
  } = props

  const itemExtraDefs = Category.getItemExtraDef(category)
  const validation = Category.getItemValidation(item)(category)
  const disabled = item.published

  const i18n = useI18n()

  return (
    <div
      className={`category__item ${active ? 'active' : ''}`}
      onClick={() => (active ? null : setCategoryItemForEdit(category, level, item, true))}
      ref={elemRef}
    >
      <ErrorBadge validation={validation} showLabel={false} />
      {active ? (
        <React.Fragment>
          <button className="btn btn-s btn-close" onClick={() => setCategoryItemForEdit(category, level, item, false)}>
            <span className="icon icon-arrow-up icon-12px" />
          </button>

          <FormItem label={i18n.t('common.code')}>
            <Input
              value={CategoryItem.getCode(item)}
              disabled={disabled}
              validation={Validation.getFieldValidation(CategoryItem.keysProps.code)(validation)}
              onChange={value =>
                putCategoryItemProp(category, level, item, CategoryItem.keysProps.code, normalizeName(value))
              }
              readOnly={readOnly}
            />
          </FormItem>

          <LabelsEditor
            labels={CategoryItem.getLabels(item)}
            onChange={labels => putCategoryItemProp(category, level, item, CategoryItem.keysProps.labels, labels)}
            readOnly={readOnly}
          />

          {Object.entries(itemExtraDefs).map(([key, { dataType }]) => (
            <FormItem label={key} key={key}>
              <Input
                value={CategoryItem.getExtraProp(key)(item)}
                mask={dataType === Category.itemExtraDefDataTypes.number ? InputMasks.decimal : null}
                readOnly={readOnly}
                validation={Validation.getFieldValidation(`${CategoryItem.keysProps.extra}_${key}`)(validation)}
                onChange={value => {
                  const extra = R.pipe(CategoryItem.getExtra, R.assoc(key, value))(item)
                  putCategoryItemProp(category, level, item, CategoryItem.keysProps.extra, extra)
                }}
              />
            </FormItem>
          ))}

          {!readOnly && (
            <button
              className="btn btn-delete"
              aria-disabled={disabled}
              onClick={() => deleteCategoryItem(category, level, item)}
            >
              <span className="icon icon-bin2 icon-12px icon-left" />
              {i18n.t('categoryEdit.deleteItem')}
            </button>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="ellipsis">{CategoryItem.getCode(item)}</div>
          <div className="ellipsis">
            {'\u00A0'}-{'\u00A0'}
          </div>
          <div className="ellipsis">{CategoryItem.getLabel(lang)(item)}</div>
        </React.Fragment>
      )}
    </div>
  )
}

export default ItemEdit
