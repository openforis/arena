import React from 'react'
import * as R from 'ramda'

import {
  getNodeDefsByCodeListUUID,
  getSurveyCodeListsArray,
} from '../../../../common/survey/survey'

import { getCodeListName } from '../../../../common/survey/codeList'

const CodeListTableRow = props => {

  const {
    survey, codeList,
    setCodeListForEdit, deleteCodeList,
    onSelect, selectedCodeListUUID
  } = props

  const name = R.defaultTo('--- undefined name ---', getCodeListName(codeList))

  const selected = codeList.uuid === selectedCodeListUUID
  return (
    <div className="code-lists__table-row">
      <label>{name}</label>

      {
        onSelect
          ? <button className={`btn btn-s btn-of-light-xs${selected ? ' active' : ''}`}
                    onClick={() => onSelect(codeList)}>
            <span className={`icon icon-checkbox-${selected ? '' : 'un'}checked icon-12px icon-left`}/>
            {selected ? 'Selected' : 'Select'}
          </button>
          : null
      }

      <button className="btn btn-s btn-of-light-xs"
              onClick={() => setCodeListForEdit(codeList)}>
        <span className="icon icon-pencil2 icon-12px icon-left"/>
        Edit
      </button>

      <button className="btn btn-s btn-of-light-xs"
              onClick={() => {
                if (getNodeDefsByCodeListUUID(codeList.uuid)(survey).length > 0) {
                  alert('This code list is used by some node definitions and cannot be removed')
                } else if (window.confirm(`Delete the code list ${getCodeListName(codeList)}? This operation cannot be undone.`)) {
                  deleteCodeList(codeList)
                }
              }}>
        <span className="icon icon-bin2 icon-12px icon-left"/>
        Delete
      </button>

    </div>
  )
}

const CodeListsTable = (props) => {
  const codeLists = getSurveyCodeListsArray(props.survey)

  return (
    R.isEmpty(codeLists)
      ? <div>No code list added</div>
      : <div className="code-lists__table">
        {
          codeLists.map(codeList =>
            <CodeListTableRow {...props}
                              key={codeList.uuid}
                              codeList={codeList}
            />)
        }
      </div>
  )
}

export default CodeListsTable