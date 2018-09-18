import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListItemEditor from './codeListItemEditor'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getCodeListLevelName, getCodeListItemsByParentId, getCodeListItemId } from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import {
  createCodeListItem,
  putCodeListLevelProp,
  openCodeListItemEditor,
  closeCodeListItemEditor
} from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import { getCodeListsEditorEditedCodeList, getCodeListsEditorSelectedItemByLevelIndex } from '../codeListsEditorState'
import { putCodeListItemProp } from '../actions'

class CodeListLevelEditor extends React.Component {

  render () {
    const {survey, level, items, editedItemId, itemEditDisabled,
      createCodeListItem, putCodeListLevelProp, openCodeListItemEditor, closeCodeListItemEditor
    } = this.props

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
              aria-disabled={itemEditDisabled}
              onClick={() => createCodeListItem(level)}>
        <span className="icon icon-plus icon-16px icon-left"/>
        ADD
      </button>

      {
        items.map(item => <CodeListItemEditor key={item.uuid}
                                              survey={survey}
                                              level={level}
                                              item={item}
                                              edit={item.id === editedItemId}
                                              putCodeListItemProp={putCodeListItemProp}
                                              onEditChange={edit => edit ? openCodeListItemEditor(item) : closeCodeListItemEditor(item)}/>)
      }
    </div>
  }
}

const mapStateToProps = (state, props) => {
  const {level} = props

  const survey = getSurvey(state)
  const codeList = getCodeListsEditorEditedCodeList(survey)

  const editedItem = getCodeListsEditorSelectedItemByLevelIndex(level.index)(survey)
  const previousLevelEditedItem = getCodeListsEditorSelectedItemByLevelIndex(level.index - 1)(survey)
  const itemEditDisabled = level.index > 0 && !previousLevelEditedItem
  const items = itemEditDisabled ? [] : getCodeListItemsByParentId(getCodeListItemId(previousLevelEditedItem))(codeList)

  return {
    survey,
    items,
    editedItemId: getCodeListItemId(editedItem),
    itemEditDisabled,
  }
}

export default connect(mapStateToProps, {
  createCodeListItem,
  putCodeListLevelProp,
  openCodeListItemEditor,
  closeCodeListItemEditor
})(CodeListLevelEditor)

