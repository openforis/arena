import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import CodeListEditItem from './codeListEditItem'

import { normalizeName } from '../../../../../common/stringUtils'

import Survey from '../../../../../common/survey/survey'
import CodeList from '../../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../../common/validation/validator'

import { getStateSurveyInfo, getSurvey } from '../../../../survey/surveyState'
import {
  getCodeListEditLevelActiveItem,
  getCodeListEditCodeList,
  getCodeListEditLevelItemsArray,
} from '../codeListEditState'

import { createCodeListItem } from '../actions'
import { putCodeListItemProp, putCodeListLevelProp } from '../actions'
import { deleteCodeListItem, deleteCodeListLevel, setCodeListItemForEdit } from '../actions'
import { getSurveyForm } from '../../surveyFormState'

import { getUser } from '../../../../app/appState'
import { canEditSurvey } from '../../../../../common/auth/authManager'

class CodeListEditLevel extends React.Component {

  handleDelete () {
    const {survey, codeList, level, deleteCodeListLevel} = this.props

    const codeListDefs = Survey.getNodeDefsByCodeListUUID(codeList.uuid)(survey)
    if (R.any(def => Survey.getNodeDefCodeListLevelIndex(def)(survey) >= level.index)(codeListDefs)) {
      alert('This code list level is used by some node definitions and cannot be removed')
    } else if (confirm('Delete the level with all items? This operation cannot be undone')) {
      deleteCodeListLevel(codeList, level)
    }
  }

  render () {
    const {
      codeList, level, parentItem, items, activeItemUUID, canAddItem,
      canBeDeleted, language,
      createCodeListItem, putCodeListLevelProp, putCodeListItemProp,
      setCodeListItemForEdit, deleteCodeListItem, readOnly,
    } = this.props

    const validation = CodeList.getCodeListLevelValidation(level.index)(codeList)

    return <div className="code-lists__edit-level">

      <div className="code-lists__edit-level-header">
        <h4 className="label">Level {level.index + 1}</h4>
        {
          !readOnly &&
          <button className="btn btn-s btn-of-light-xs"
                  onClick={() => this.handleDelete()}
                  aria-disabled={!canBeDeleted}>
            <span className="icon icon-bin2 icon-12px"/>
          </button>
        }
      </div>

      <FormItem label={'name'}>
        <Input value={CodeList.getCodeListLevelName(level)}
               validation={getFieldValidation('name')(validation)}
               onChange={value => putCodeListLevelProp(codeList, level, 'name', normalizeName(value))}
               readOnly={readOnly}/>
      </FormItem>

      <div className="code-lists__edit-level-items-header">
        <h5 className="label">Items</h5>
        {
          !readOnly &&
          <button className="btn btn-s btn-of-light-xs btn-add-item"
                  aria-disabled={!canAddItem}
                  onClick={() => createCodeListItem(codeList, level, parentItem)}>
            <span className="icon icon-plus icon-12px icon-left"/>
            ADD
          </button>
        }
      </div>

      <div className="code-lists__edit-level-items">
        {
          items.map(item =>
            <CodeListEditItem key={item.uuid}
                              language={language}
                              codeList={codeList}
                              level={level}
                              item={item}
                              active={item.uuid === activeItemUUID}
                              putCodeListItemProp={putCodeListItemProp}
                              setCodeListItemForEdit={setCodeListItemForEdit}
                              deleteCodeListItem={deleteCodeListItem}
                              readOnly={readOnly}/>
          )
        }
      </div>
    </div>
  }
}

const mapStateToProps = (state, props) => {
  const {level} = props
  const {index} = level

  const survey = getSurvey(state)
  const surveyInfo = getStateSurveyInfo(state)
  const surveyForm = getSurveyForm(state)
  const language = Survey.getDefaultLanguage(surveyInfo)

  const codeList = getCodeListEditCodeList(survey)(surveyForm)
  const activeItem = getCodeListEditLevelActiveItem(index)(surveyForm)
  const parentItem = getCodeListEditLevelActiveItem(index - 1)(surveyForm)

  const canAddItem = index === 0 || parentItem
  const items = canAddItem ? getCodeListEditLevelItemsArray(index)(surveyForm) : []
  const canBeDeleted = CodeList.isCodeListLevelDeleteAllowed(level)(codeList)

  const user = getUser(state)

  return {
    language,
    codeList,
    items,
    activeItemUUID: activeItem ? activeItem.uuid : null,
    parentItem,
    canAddItem,
    canBeDeleted,
    readOnly: !canEditSurvey(user, surveyInfo),
  }
}

export default connect(mapStateToProps, {
  createCodeListItem,
  putCodeListLevelProp,
  putCodeListItemProp,
  deleteCodeListLevel,
  setCodeListItemForEdit,
  deleteCodeListItem,
})(CodeListEditLevel)

