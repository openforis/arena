import React from 'react'
import * as R from 'ramda'

import LabelsEditor from '../../../../survey/components/labelsEditor'
import { FormItem, Input } from '../../../../commonComponents/form/input'
import ErrorBadge from '../../../../commonComponents/errorBadge'

import { normalizeName } from '../../../../../common/stringUtils'

import Category from '../../../../../common/survey/category'
import { getFieldValidation } from '../../../../../common/validation/validator'

class ItemEdit extends React.Component {

  constructor (props) {
    super(props)
    this.elemRef = React.createRef()
  }

  componentDidMount () {
    if (this.props.active)
      this.scrollIntoView()
  }

  componentDidUpdate (prevProps) {
    if (this.props.active && !prevProps.active)
      this.scrollIntoView()
  }

  scrollIntoView () {
    this.elemRef.current.scrollIntoView()
  }

  onPropLabelsChange (labelItem) {
    const {category, level, item, putCategoryItemProp} = this.props
    putCategoryItemProp(
      category,
      level,
      item,
      'labels',
      R.assoc(labelItem.lang, labelItem.label, Category.getItemLabels(item))
    )
  }

  render () {
    const {
      category, level, item, active,
      putCategoryItemProp, setCategoryItemForEdit, deleteCategoryItem,
      language, readOnly
    } = this.props

    const validation = Category.getItemValidation(item)(category)
    const disabled = item.published
    return (
      <div className={`category-edit__item ${active ? 'active' : ''}`}
           onClick={() => active ? null : setCategoryItemForEdit(category, level, item, true)}
           ref={this.elemRef}>
        <ErrorBadge validation={validation} showInvalidLabel={false}/>
        {
          active
            ? (
              <React.Fragment>

                <button className="btn-s btn-of-light-xs btn-close"
                        onClick={() => setCategoryItemForEdit(category, level, item, false)}>
                  <span className="icon icon-arrow-up icon-12px"/>
                </button>

                <FormItem label={'code'}>
                  <Input value={Category.getItemCode(item)}
                         disabled={disabled}
                         validation={getFieldValidation('code')(validation)}
                         onChange={value => putCategoryItemProp(category, level, item, 'code', normalizeName(value))}
                         readOnly={readOnly}/>
                </FormItem>

                <LabelsEditor labels={Category.getItemLabels(item)}
                              onChange={(labelItem) => this.onPropLabelsChange(labelItem)}
                              readOnly={readOnly}/>

                {
                  !readOnly &&
                  <button className="btn btn-of-light btn-delete"
                          aria-disabled={disabled}
                          onClick={() => {
                            if (confirm('Delete the item with all children? This operation cannot be undone')) {
                              deleteCategoryItem(category, level, item)
                            }
                          }}>
                    <span className="icon icon-bin2 icon-12px icon-left"/>
                    Delete Item
                  </button>
                }
              </React.Fragment>
            )
            : (
              <React.Fragment>
                <div>{Category.getItemCode(item)}</div>
                <div>{'\xA0'}-{'\xA0'}</div>
                <div>{Category.getItemLabel(language)(item)}</div>
              </React.Fragment>
            )
        }
      </div>
    )
  }
}

export default ItemEdit