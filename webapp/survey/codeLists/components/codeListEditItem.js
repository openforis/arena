import React from 'react'
import * as R from 'ramda'

import LabelsEditor from '../../components/labelsEditor'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getSurveyDefaultLanguage } from '../../../../common/survey/survey'
import {
  getCodeListItemCode,
  getCodeListItemLabel,
  getCodeListItemLabels,
  getCodeListItemValidation
} from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

class CodeListEditItem extends React.Component {

  constructor (props) {
    super(props)
    this.elemRef = React.createRef()
  }

  componentDidUpdate (prevProps) {
    if (
      (this.props.active && !prevProps.active) ||
      (this.props.item.id && !prevProps.item.id)
    )
      this.elemRef.current.scrollIntoView()
  }

  onPropLabelsChange (labelItem) {
    const {level, item, putCodeListItemProp} = this.props
    putCodeListItemProp(level.index, item.uuid, 'labels',
      R.assoc(labelItem.lang, labelItem.label, getCodeListItemLabels(item)))
  }

  render () {
    const {
      survey, codeList, level, ancestorItemUUIDs, item, active,
      putCodeListItemProp, setCodeListItemForEdit, deleteCodeListItem
    } = this.props

    const validation = getCodeListItemValidation(R.append(item.uuid, ancestorItemUUIDs))(codeList)
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

    const language = getSurveyDefaultLanguage(survey)

    const disabled = item.published
    return (
      <div className={`code-lists__edit-item ${active ? 'active' : ''}`}
           onClick={() => active ? null : setCodeListItemForEdit(item, true)}
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
                        onClick={() => setCodeListItemForEdit(item, false)}>
                  <span className="icon icon-arrow-up icon-12px"/>
                </button>

                <FormItem label={'code'}>
                  <Input value={getCodeListItemCode(item)}
                         disabled={disabled}
                         validation={getFieldValidation('code')(validation)}
                         onChange={e => putCodeListItemProp(level.index, item.uuid, 'code', normalizeName(e.target.value))}/>
                </FormItem>

                <LabelsEditor labels={getCodeListItemLabels(item)}
                              onChange={(labelItem) => this.onPropLabelsChange(labelItem)}/>

                <button className="btn btn-of-light btn-delete"
                        aria-disabled={disabled}
                        onClick={() => {
                          if (confirm('Delete the item with all children? This operation cannot be undone')) {
                            deleteCodeListItem(item)
                          }
                        }}>
                  <span className="icon icon-bin2 icon-12px icon-left"/>
                  Delete Item
                </button>

              </React.Fragment>
            )
            : (
              <React.Fragment>
                <div>{getCodeListItemCode(item)}</div>
                <div>{'\xA0'}-{'\xA0'}</div>
                <div>{getCodeListItemLabel(language)(item)}</div>
              </React.Fragment>
            )
        }
      </div>
    )
  }
}

export default CodeListEditItem