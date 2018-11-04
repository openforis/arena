import React from 'react'
import * as R from 'ramda'

import LabelsEditor from '../../components/labelsEditor'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { normalizeName } from '../../../../common/survey/surveyUtils'

import CodeList from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

class CodeListEditItem extends React.Component {

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
    const {codeList, level, item, putCodeListItemProp} = this.props
    putCodeListItemProp(
      codeList,
      level,
      item,
      'labels',
      R.assoc(labelItem.lang, labelItem.label, CodeList.getCodeListItemLabels(item))
    )
  }

  render () {
    const {
      codeList, level, item, active,
      putCodeListItemProp, setCodeListItemForEdit, deleteCodeListItem,
      language
    } = this.props

    const validation = CodeList.getCodeListItemValidation(item)(codeList)
    const validationGlobalErrorMessage = validation.valid
      ? null
      : R.pipe(
        R.keys,
        R.reject(field => getFieldValidation(field)(validation).valid),
        R.map(field => {
          const fieldValidation = getFieldValidation(field)(validation)
          const fieldErrors = R.propOr([], 'errors', fieldValidation)
          const fieldErrorMessage = R.isEmpty(fieldErrors) ? 'Invalid' : R.join(', ', fieldErrors)
          return `${field}: ${fieldErrorMessage}`
        }),
        R.join('\n'),
      )(validation.fields)

    const disabled = item.published
    return (
      <div className={`code-lists__edit-item ${active ? 'active' : ''}`}
           onClick={() => active ? null : setCodeListItemForEdit(codeList, level, item, true)}
           ref={this.elemRef}>
        {
          !validation.valid &&
          <span className="error-badge"
                title={validationGlobalErrorMessage}>
              <span className="icon icon-warning icon-12px"/>
            </span>
        }

        {
          active
            ? (
              <React.Fragment>

                <button className="btn-s btn-of-light-xs btn-close"
                        onClick={() => setCodeListItemForEdit(codeList, level, item, false)}>
                  <span className="icon icon-arrow-up icon-12px"/>
                </button>

                <FormItem label={'code'}>
                  <Input value={CodeList.getCodeListItemCode(item)}
                         disabled={disabled}
                         validation={getFieldValidation('code')(validation)}
                         onChange={e => putCodeListItemProp(codeList, level, item, 'code', normalizeName(e.target.value))}/>
                </FormItem>

                <LabelsEditor labels={CodeList.getCodeListItemLabels(item)}
                              onChange={(labelItem) => this.onPropLabelsChange(labelItem)}/>

                <button className="btn btn-of-light btn-delete"
                        aria-disabled={disabled}
                        onClick={() => {
                          if (confirm('Delete the item with all children? This operation cannot be undone')) {
                            deleteCodeListItem(codeList, level, item)
                          }
                        }}>
                  <span className="icon icon-bin2 icon-12px icon-left"/>
                  Delete Item
                </button>

              </React.Fragment>
            )
            : (
              <React.Fragment>
                <div>{CodeList.getCodeListItemCode(item)}</div>
                <div>{'\xA0'}-{'\xA0'}</div>
                <div>{CodeList.getCodeListItemLabel(language)(item)}</div>
              </React.Fragment>
            )
        }
      </div>
    )
  }
}

export default CodeListEditItem