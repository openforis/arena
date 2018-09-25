import React from 'react'
import * as R from 'ramda'

import LabelsEditor from '../../components/labelsEditor'
import { FormItem, Input } from '../../../commonComponents/form/input'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getSurveyDefaultLanguage } from '../../../../common/survey/survey'
import { getCodeListItemCode, getCodeListItemLabel, getCodeListItemLabels } from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

const onPropLabelsChange = (props, labelItem) => {
  const {level, item, putCodeListItemProp} = props
  putCodeListItemProp(level.index, item.uuid, 'labels',
    R.assoc(labelItem.lang, labelItem.label, getCodeListItemLabels(item)))
}

const CodeListEditItem = (props) => {

  const {
    survey, level, item, active,
    putCodeListItemProp, setCodeListItemForEdit, deleteCodeListItem
  } = props

  const validation = {} //TODO
  const language = getSurveyDefaultLanguage(survey)

  return (
    <div className={`code-lists__edit-item ${active ? 'active' : ''}`}
         onClick={() => active ? null : setCodeListItemForEdit(item, true)}>
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
                       validation={getFieldValidation('code')(validation)}
                       onChange={e => putCodeListItemProp(level.index, item.uuid, 'code', normalizeName(e.target.value))}/>
              </FormItem>

              <LabelsEditor labels={getCodeListItemLabels(item)}
                            onChange={(labelItem) => onPropLabelsChange(props, labelItem)}/>

              <button className="btn btn-of-light btn-delete"
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
              <div/>
              <div>{getCodeListItemCode(item)}</div>
              <div>{'\xA0'}-{'\xA0'}</div>
              <div>{getCodeListItemLabel(language)(item)}</div>
            </React.Fragment>
          )
      }
    </div>
  )
}

export default CodeListEditItem