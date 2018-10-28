import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListEditItem from './codeListEditItem'

import { normalizeName } from '../../../../common/survey/surveyUtils'
import {
  getCodeLists,
  getNodeDefsByCodeListUUID,
  getNodeDefCodeListLevelIndex,
} from '../../../../common/survey/survey'
import {
  getCodeListLevelName,
  getCodeListLevelValidation,
  isCodeListLevelDeleteAllowed
} from '../../../../common/survey/codeList'
import { getFieldValidation } from '../../../../common/validation/validator'

import {
  createCodeListItem,
  putCodeListLevelProp,
  deleteCodeListLevel,
  setCodeListItemForEdit,
  deleteCodeListItem,
} from '../actions'
import { getSurvey } from '../../surveyState'
import {
  getCodeListEditLevelItem,
  getCodeListEdit,
  getCodeListEditLevelItemsArray,
  getCodeListEditActiveItemAndAncestorsUUIDs,
} from '../codeListsState'
import { putCodeListItemProp } from '../actions'

class CodeListEditLevel extends React.Component {

  handleDelete () {
    const {survey, codeList, level, deleteCodeListLevel} = this.props

    const codeListDefs = getNodeDefsByCodeListUUID(codeList.uuid)(survey)
    if (R.any(def => getNodeDefCodeListLevelIndex(def)(survey) >= level.index)(codeListDefs)) {
      alert('This code list level is used by some node definitions and cannot be removed')
    } else if (confirm('Delete the level with all items? This operation cannot be undone')) {
      deleteCodeListLevel(level.index)
    }
  }

  render () {
    const {
      survey, codeList, level, ancestorItemUUIDs, items, activeItemUUID, disabledItems,
      canBeDeleted,
      createCodeListItem, putCodeListLevelProp, putCodeListItemProp, setCodeListItemForEdit, deleteCodeListItem,
    } = this.props

    const validation = getCodeListLevelValidation(level.index)(codeList)

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
                              codeList={codeList}
                              level={level}
                              ancestorItemUUIDs={ancestorItemUUIDs}
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

  const codeList = getCodeListEdit(survey)
  const activeItem = getCodeListEditLevelItem(level.index)(survey)
  const ancestorItemUUIDs = getCodeListEditActiveItemAndAncestorsUUIDs(level.index - 1)(survey)
  const previousLevelActiveItem = getCodeListEditLevelItem(level.index - 1)(survey)
  const disabledItems = level.index > 0 && !previousLevelActiveItem
  const items = disabledItems ? [] : getCodeListEditLevelItemsArray(level.index)(survey)
  const canBeDeleted = isCodeListLevelDeleteAllowed(level)(codeList)

  return {
    survey,
    codeList,
    ancestorItemUUIDs,
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

