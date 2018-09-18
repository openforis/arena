import React from 'react'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListLevelEditor from './CodeListLevelEditor'

import { getCodeListName } from '../../../../common/survey/codeList'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getFieldValidation } from '../../../../common/validation/validator'

import { putCodeListProp, createCodeListLevel } from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import { getCodeListsEditorEditedCodeList } from '../codeListsEditorState'

class CodeListEditor extends React.Component {

  render () {
    const { codeList, putCodeListProp, createCodeListLevel } = this.props
    const { levels, validation } = codeList

    return <div>

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
  }

}

const mapStateToProps = (state) => {
  const survey = getSurvey(state)

  return {
    survey,
    codeList: getCodeListsEditorEditedCodeList(survey),
  }
}

export default connect(mapStateToProps, {putCodeListProp, createCodeListLevel})(CodeListEditor)