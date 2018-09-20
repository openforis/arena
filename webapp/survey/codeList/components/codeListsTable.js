import './codeListsEditor.scss'

import React from 'react'
import * as R from 'ramda'

import { getCodeListName } from '../../../../common/survey/codeList'

const CodeListsTable = ({codeLists, setCodeListForEdit, deleteCodeList}) => {
  return (
    <div className="code-lists-table">
      {codeLists.map(codeList =>
        <TableRow setCodeListForEdit={setCodeListForEdit}
                  deleteCodeList={deleteCodeList}
                  key={codeList.uuid}
                  codeList={codeList}/>)
      }
    </div>
  )
}

const TableRow = ({codeList, setCodeListForEdit, deleteCodeList}) => {
  const name = R.defaultTo('--- undefined name ---', getCodeListName(codeList))

  return (
    <div className="row">
      <label>{name}</label>
      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '50px'}}
              onClick={() => setCodeListForEdit(codeList.id)}>
        <span className="icon icon-pencil2 icon-16px icon-left"/>
        EDIT
      </button>
      <button className="btn btn-s btn-of-light-xs"
              style={{marginLeft: '50px'}}
              onClick={() => deleteCodeList(codeList)}>
        <span className="icon icon-cross icon-16px icon-left"/>
        DELETE
      </button>
    </div>
  )
}

export default CodeListsTable