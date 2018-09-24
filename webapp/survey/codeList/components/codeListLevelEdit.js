import React from 'react'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListItemEdit from './codeListItemEdit'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import {
  getCodeListLevelName,
  getCodeListItemUUID,
  isCodeListLevelDeleteAllowed
} from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import {
  createCodeListItem,
  putCodeListLevelProp,
  deleteCodeListLevel,
  setCodeListItemForEdit,
} from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import {
  getCodeListEditActiveLevelItem,
  getCodeListEditCodeList,
  getCodeListEditLevelItemsArray,
} from '../codeListEditorState'
import { putCodeListItemProp } from '../actions'

class CodeListLevelEdit extends React.Component {

  handleDelete () {
    const {level, deleteCodeListLevel} = this.props

    if (window.confirm('Delete the level with all items? This operation cannot be undone')) {
      deleteCodeListLevel(level.index)
    }
  }

  render () {
    const {
      survey, level, items, editedItemUUID, itemEditDisabled,
      createCodeListItem, putCodeListLevelProp, putCodeListItemProp, setCodeListItemForEdit,
      levelDeleteDisabled,
    } = this.props

    const validation = {} //TODO

    return <div>
      <div style={{display: 'flex'}}>
        <h2>LEVEL {level.index + 1}</h2>
        <button className="btn btn-s btn-of-light-xs"
                style={{marginLeft: '50px'}}
                onClick={() => this.handleDelete()}
                aria-disabled={levelDeleteDisabled}>
          <span className="icon icon-cross icon-16px icon-left"/>
        </button>
      </div>

      <FormItem label={'name'}>
        <Input value={getCodeListLevelName(level)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListLevelProp(level.codeListId, level.index, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <div style={{display: 'flex'}}>
        <h3>Items</h3>

        <button className="btn btn-s btn-of-light-xs"
                style={{marginLeft: '50px'}}
                aria-disabled={itemEditDisabled}
                onClick={() => createCodeListItem(level)}>
          <span className="icon icon-plus icon-16px icon-left"/>
          ADD
        </button>
      </div>

      {
        items.map(item => <CodeListItemEdit key={item.uuid}
                                            survey={survey}
                                            level={level}
                                            item={item}
                                            edit={item.uuid === editedItemUUID}
                                            putCodeListItemProp={putCodeListItemProp}
                                            onEditChange={edit => setCodeListItemForEdit(item, edit)}/>)
      }
    </div>
  }
}

const mapStateToProps = (state, props) => {
  const {level} = props

  const survey = getSurvey(state)

  const codeList = getCodeListEditCodeList(survey)
  const editedItem = getCodeListEditActiveLevelItem(level.index)(survey)
  const previousLevelEditedItem = getCodeListEditActiveLevelItem(level.index - 1)(survey)
  const itemEditDisabled = level.index > 0 && !previousLevelEditedItem
  const items = itemEditDisabled ? [] : getCodeListEditLevelItemsArray(level.index)(survey)
  const levelDeleteDisabled = !isCodeListLevelDeleteAllowed(level)(codeList)

  return {
    survey,
    items,
    editedItemUUID: getCodeListItemUUID(editedItem),
    itemEditDisabled,
    levelDeleteDisabled,
  }
}

export default connect(mapStateToProps, {
  createCodeListItem,
  putCodeListLevelProp,
  putCodeListItemProp,
  deleteCodeListLevel,
  setCodeListItemForEdit,
})(CodeListLevelEdit)

