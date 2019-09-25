import React, { useEffect, useRef } from 'react'
import * as R from 'ramda'

import LabelsEditor from '../../labelsEditor/labelsEditor'
import { FormItem, Input } from '../../../../commonComponents/form/input'
import ErrorBadge from '../../../../commonComponents/errorBadge'
import useI18n from '../../../../commonComponents/useI18n'

import { normalizeName } from '../../../../../common/stringUtils'

import Category from '../../../../../common/survey/category'
import CategoryItem from '../../../../../common/survey/categoryItem'
import Validation from '../../../../../common/validation/validation'

const ItemEdit = (props) => {

  const elemRef = useRef(null)

  useEffect(() => {
    if (props.active) {
      elemRef.current.scrollIntoView(false)
    }
  }, [props.active])

  const onPropLabelsChange = (labelItem) => {
    const { category, level, item, putCategoryItemProp } = props

    putCategoryItemProp(
      category,
      level,
      item,
      'labels',
      R.assoc(labelItem.lang, labelItem.label, CategoryItem.getLabels(item))
    )
  }

  const {
    category, level, item, active,
    putCategoryItemProp, setCategoryItemForEdit, deleteCategoryItem,
    lang, readOnly
  } = props

  const validation = Category.getItemValidation(item)(category)
  const disabled = item.published

  const i18n = useI18n()

  return (
    <div className={`category-edit__item ${active ? 'active' : ''}`}
         onClick={() => active ? null : setCategoryItemForEdit(category, level, item, true)}
         ref={elemRef}>
      <ErrorBadge validation={validation} showLabel={false}/>
      {
        active
          ? (
            <React.Fragment>

              <button className="btn btn-s btn-close"
                      onClick={() => setCategoryItemForEdit(category, level, item, false)}>
                <span className="icon icon-arrow-up icon-12px"/>
              </button>

              <FormItem label={i18n.t('common.code')}>
                <Input value={CategoryItem.getCode(item)}
                       disabled={disabled}
                       validation={Validation.getFieldValidation(CategoryItem.props.code)(validation)}
                       onChange={value => putCategoryItemProp(category, level, item, CategoryItem.props.code, normalizeName(value))}
                       readOnly={readOnly}/>
              </FormItem>

              <LabelsEditor labels={CategoryItem.getLabels(item)}
                            onChange={(labelItem) => onPropLabelsChange(labelItem)}
                            readOnly={readOnly}/>

              {
                !readOnly &&
                <button className="btn btn-delete"
                        aria-disabled={disabled}
                        onClick={() => {
                          if (confirm(i18n.t('categoryEdit.confirmDeleteItem'))) {
                            deleteCategoryItem(category, level, item)
                          }
                        }}>
                  <span className="icon icon-bin2 icon-12px icon-left"/>
                  {i18n.t('categoryEdit.deleteItem')}
                </button>
              }
            </React.Fragment>
          )
          : (
            <React.Fragment>
              <div className="ellipsis">{CategoryItem.getCode(item)}</div>
              <div className="ellipsis">{'\xA0'}-{'\xA0'}</div>
              <div className="ellipsis">{CategoryItem.getLabel(lang)(item)}</div>
            </React.Fragment>
          )
      }
    </div>
  )
}

export default ItemEdit