import React from 'react'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListItemEditor from './codeListItemEditor'

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
  openCodeListItemEditor,
  closeCodeListItemEditor
} from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import {
  getCodeListEditorActiveLevelItem,
  getCodeListEditorCodeList,
  getCodeListEditorLevelItems
} from '../codeListEditorState'
import { putCodeListItemProp } from '../actions'

class CodeListLevelEditor extends React.Component {

  handleDelete () {
    const {level, deleteCodeListLevel} = this.props

    if (window.confirm('DELETE THE LEVEL AND ALL ASSOCIATED ITEMS?')) {
      deleteCodeListLevel(level.uuid)
    }
  }

  render () {
    const {
      survey, level, items, editedItemUUID, itemEditDisabled,
      createCodeListItem, putCodeListLevelProp, putCodeListItemProp,
      openCodeListItemEditor, closeCodeListItemEditor,
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
               onChange={e => putCodeListLevelProp(level.codeListId, level.uuid, 'name', normalizeName(e.target.value))}/>
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
        items.map(item => <CodeListItemEditor key={item.uuid}
                                              survey={survey}
                                              level={level}
                                              item={item}
                                              edit={item.uuid === editedItemUUID}
                                              putCodeListItemProp={putCodeListItemProp}
                                              onEditChange={edit => edit ? openCodeListItemEditor(item) : closeCodeListItemEditor(item)}/>)
      }
    </div>
  }
}

const mapStateToProps = (state, props) => {
  const {level} = props

  const survey = getSurvey(state)

  const codeList = getCodeListEditorCodeList(survey)
  const editedItem = getCodeListEditorActiveLevelItem(level.index)(survey)
  const previousLevelEditedItem = getCodeListEditorActiveLevelItem(level.index - 1)(survey)
  const itemEditDisabled = level.index > 0 && !previousLevelEditedItem
  const items = itemEditDisabled ? [] : getCodeListEditorLevelItems(level.index)(survey)
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
  openCodeListItemEditor,
  closeCodeListItemEditor
})(CodeListLevelEditor)

