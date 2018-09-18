import React from 'react'
import { connect } from 'react-redux'

import { FormItem, Input } from '../../../commonComponents/form/input'
import CodeListLevelEdit from './codeListLevelEdit'

import { getCodeListName, newCodeListLevel } from '../../../../common/survey/codeList'
import { normalizeName } from '../../../../common/survey/surveyUtils'
import { getFieldValidation } from '../../../../common/validation/validator'

import { putCodeListProp, createCodeListLevel } from '../../codeList/actions'
import { getSurvey } from '../../surveyState'
import { getCodeListsEditorEditedCodeList } from '../codeListsEditorState'

class CodeListEdit extends React.Component {

  addNewLevel() {
    const {codeList, createCodeListLevel} = this.props
    const {levels} = codeList
    const level = newCodeListLevel(codeList.id, levels.length)
    createCodeListLevel(level)
  }

  render () {
    const { codeList, putCodeListProp } = this.props
    const { levels, validation } = codeList

    return <div>

      <FormItem label={'name'}>
        <Input value={getCodeListName(codeList)}
               validation={getFieldValidation('name')(validation)}
               onChange={e => putCodeListProp(codeList.uuid, 'name', normalizeName(e.target.value))}/>
      </FormItem>

      <div style={{display: 'flex'}}>
        {
          levels.map(level => <CodeListLevelEdit key={level.uuid}
                                             level={level}
                                             parentId={null}/>)
        }
        <button className="btn btn-s btn-of-light-xs"
                style={{marginLeft: '50px'}}
                onClick={() => this.addNewLevel()}>
          <span className="icon icon-plus icon-16px icon-left"></span>
          ADD
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

export default connect(mapStateToProps, {putCodeListProp, createCodeListLevel})(CodeListEdit)