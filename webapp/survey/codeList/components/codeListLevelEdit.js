import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListItemEdit from './codeListItemEdit'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getCodeListLevelName, newCodeListItem, getCodeListItemsByParentId } from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import {
  createCodeListItem,
  putCodeListLevelProp,
  editCodeListItem,
  closeCodeListItemEditor
} from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import { getCodeListsEditorEditedCodeList, getCodeListsEditorSelectedItemsByLevelIndex } from '../codeListsEditorState'

class CodeListLevelEdit extends React.Component {

  addNewItem () {
    const {level, parentItem, createCodeListItem} = this.props
    const {codeListId} = level
    const item = newCodeListItem(level.id, parentItem ? parentItem.id : null)
    createCodeListItem(codeListId, item)
  }

  render () {
    const {level, items, selectedItem, putCodeListLevelProp, editCodeListItem} = this.props

    const validation = {} //TODO

    return <div>
      <h2>LEVEL {level.index + 1}</h2>

      <FormItem label={'name'}>
        <Input value={getCodeListLevelName(level)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListLevelProp(level.codeListId, level.uuid, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <h3>Items</h3>

      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '50px'}}
              onClick={() => this.addNewItem()}>
        <span className="icon icon-plus icon-16px icon-left"/>
        ADD
      </button>

      {
        items.map(item => <CodeListItemEdit key={item.uuid}
                                            level={level}
                                            item={item}
                                            edit={selectedItem === item}
                                            onEditChange={edit => edit ? editCodeListItem(item) : closeCodeListItemEditor(item)}/>)
      }
    </div>
  }
}

const mapStateToProps = (state, props) => {
  const {level} = props

  const survey = getSurvey(state)
  const codeList = getCodeListsEditorEditedCodeList(survey)

  const editedItemsByLevelIndex = getCodeListsEditorSelectedItemsByLevelIndex(survey)
  const previousLevelSelectedItem = level.index > 0 ? editedItemsByLevelIndex[level.index - 1] : null
  const items = getCodeListItemsByParentId(R.prop('id', previousLevelSelectedItem))(codeList)
  const selectedItem = editedItemsByLevelIndex.length > level.index ? editedItemsByLevelIndex[level.index] : null

  return {
    survey,
    items,
    selectedItem,
  }
}

export default connect(mapStateToProps, {
  createCodeListItem,
  putCodeListLevelProp,
  editCodeListItem,
  closeCodeListItemEditor
})(CodeListLevelEdit)

