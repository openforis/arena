import React from 'react'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListEditItem from './codeListEditItem'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import {
  getCodeListLevelName,
  isCodeListLevelDeleteAllowed
} from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import {
  createCodeListItem,
  putCodeListLevelProp,
  deleteCodeListLevel,
  setCodeListItemForEdit,
  deleteCodeListItem,
} from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import {
  getCodeListEditActiveLevelItem,
  getCodeListEditCodeList,
  getCodeListEditLevelItemsArray,
} from '../codeListEditorState'
import { putCodeListItemProp } from '../actions'

class CodeListEditLevel extends React.Component {

  handleDelete () {
    const {level, deleteCodeListLevel} = this.props

    if (confirm('Delete the level with all items? This operation cannot be undone')) {
      deleteCodeListLevel(level.index)
    }
  }

  render () {
    const {
      survey, level, items, activeItemUUID, disabledItems,
      canBeDeleted,
      createCodeListItem, putCodeListLevelProp, putCodeListItemProp, setCodeListItemForEdit, deleteCodeListItem,
    } = this.props

    const validation = {} //TODO

    return <div className="code-lists__edit-level">

      <div className="code-lists__edit-level-header">
        <h4 className="label">Level {level.index + 1}</h4>
        <button className="btn btn-s btn-of-light-xs"
                onClick={() => this.handleDelete()}
                aria-disabled={!canBeDeleted}>
          <span className="icon icon-bin2 icon-12px"/>
        </button>
      </div>

      <FormItem label={'name'}>
        <Input value={getCodeListLevelName(level)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListLevelProp(level.codeListId, level.index, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <div className="code-lists__edit-level-items-header">
        <h5 className="label">Items</h5>

        <button className="btn btn-s btn-of-light-xs btn-add-item"
                aria-disabled={disabledItems}
                onClick={() => createCodeListItem(level)}>
          <span className="icon icon-plus icon-12px icon-left"/>
          ADD
        </button>
      </div>

      <div className="code-lists__edit-level-items">
        {
          items.map(item =>
            <CodeListEditItem key={item.uuid}
                              survey={survey}
                              level={level}
                              item={item}
                              active={item.uuid === activeItemUUID}
                              putCodeListItemProp={putCodeListItemProp}
                              setCodeListItemForEdit={setCodeListItemForEdit}
                              deleteCodeListItem={deleteCodeListItem}/>
          )
        }
      </div>
    </div>
  }
}

const mapStateToProps = (state, props) => {
  const {level} = props

  const survey = getSurvey(state)

  const codeList = getCodeListEditCodeList(survey)
  const activeItem = getCodeListEditActiveLevelItem(level.index)(survey)
  const previousLevelEditedItem = getCodeListEditActiveLevelItem(level.index - 1)(survey)
  const disabledItems = level.index > 0 && !previousLevelEditedItem
  const items = disabledItems ? [] : getCodeListEditLevelItemsArray(level.index)(survey)
  const canBeDeleted = isCodeListLevelDeleteAllowed(level)(codeList)

  return {
    survey,
    items,
    activeItemUUID: activeItem ? activeItem.uuid : null,
    disabledItems,
    canBeDeleted,
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

