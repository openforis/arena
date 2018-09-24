import React from 'react'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListLevelEditor from './codeListLevelEdit'

import { getCodeListName, getCodeListLevelsArray } from '../../../../common/survey/codeList'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getFieldValidation } from '../../../../common/validation/validator'

const CodeListEdit = props => {

  const {codeList, putCodeListProp, createCodeListLevel} = props
  const {validation} = codeList
  const levels = getCodeListLevelsArray(codeList)

  return (
    <div>

      <FormItem label={'name'}>
        <Input value={getCodeListName(codeList)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListProp(codeList.uuid, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <div style={{display: 'flex'}}>
        {
          levels.map(level => <CodeListLevelEditor key={level.uuid}
                                                   level={level}/>)
        }
        <button className="btn btn-s btn-of-light-xs"
                style={{marginLeft: '50px'}}
                onClick={() => createCodeListLevel()}>
          <span className="icon icon-plus icon-16px icon-left"/>
          ADD LEVEL
        </button>
      </div>
    </div>
  )
}

export default CodeListEdit