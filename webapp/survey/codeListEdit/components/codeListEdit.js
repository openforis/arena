import './codeListEdit.scss'

import React from 'react'

import { isBlank } from '../../../../common/stringUtils'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListEditLevel from './codeListEditLevel'

import CodeList from '../../../../common/survey/codeList'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getFieldValidation } from '../../../../common/validation/validator'

const CodeListEdit = props => {

  const {
    codeList,
    putCodeListProp, createCodeListLevel,
    setCodeListForEdit,
  } = props
  const {validation} = codeList
  const levels = CodeList.getCodeListLevelsArray(codeList)

  const codeListName = CodeList.getCodeListName(codeList)
  return (
    <div className="code-lists__edit">

      <FormItem label="Code list name">
        <Input value={codeListName}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListProp(codeList, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <div className="code-lists__edit-levels">
        {
          levels.map(level =>
            <CodeListEditLevel key={level.uuid}
                               level={level}/>
          )
        }

        <button className="btn btn-s btn-of-light-xs btn-add-level"
                onClick={() => createCodeListLevel(codeList)}
                aria-disabled={levels.length === 5}>
          <span className="icon icon-plus icon-16px icon-left"/>
          ADD LEVEL
        </button>
      </div>

      <div style={{justifySelf: 'center'}}>
        <button className="btn btn-of-light"
                aria-disabled={isBlank(codeListName)}
                onClick={() => setCodeListForEdit(null)}>
          Done
        </button>
      </div>

    </div>
  )
}

export default CodeListEdit