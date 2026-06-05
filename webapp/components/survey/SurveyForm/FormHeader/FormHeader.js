import './formHeader.scss'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { uuidv4 } from '@core/uuid'

import { TreeSelectViewMode } from '@webapp/model'
import { NodeDefsActions, useIsSurveyDirty, useSurveyCycleKey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import {
  SurveyFormActions,
  useNodeDefLabelType,
  useNodeDefPage,
  useShowPageNavigation,
  useTreeSelectViewMode,
} from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'
import { Button } from '@webapp/components/buttons'

import FormEntryActions from '../components/formEntryActions'
import FormEditActions from '../components/formEditActions'
import { usePath } from './usePath'
import FormHeaderAdvancedButton from './FormHeaderAdvancedButton'

const FormHeader = (props) => {
  const { disableLockUnlock, disableValidationReport, edit, entry, preview, canEditDef, analysis } = props

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const surveyIsDirty = useIsSurveyDirty()
  const nodeDefLabelType = useNodeDefLabelType()
  const nodeDefPage = useNodeDefPage()
  const showPageNavigation = useShowPageNavigation()
  const canEditSurvey = useAuthCanEditSurvey()
  const path = usePath(entry)
  const treeViewMode = useTreeSelectViewMode()
  const cycle = useSurveyCycleKey()

  return (
    <div className="survey-form-header">
      <div className="survey-form-header__label-container">
        <Button
          disabled={surveyIsDirty}
          iconClassName="icon-stack icon-12px"
          onClick={() => dispatch(SurveyFormActions.toggleFormPageNavigation())}
          size="small"
          title={`surveyForm:${showPageNavigation ? 'hide' : 'show'}Pages`}
          variant="text"
        >
          <span className={`icon icon-${showPageNavigation ? 'shrink2' : 'enlarge2'} icon-12px`} />
        </Button>

        {edit && canEditDef && treeViewMode === TreeSelectViewMode.onlyPages && (
          <Button
            iconClassName="icon-plus icon-12px"
            label="surveyForm:subPage"
            onClick={() => {
              const propsNodeDef = {
                [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(cycle, NodeDefLayout.renderType.form, uuidv4()),
              }
              dispatch(NodeDefsActions.createNodeDef(nodeDefPage, NodeDef.nodeDefType.entity, propsNodeDef, navigate))
            }}
            size="small"
            testId={TestId.surveyForm.addSubPageBtn}
            variant="text"
          />
        )}

        <div
          className="survey-form-header__path"
          data-nodedef-name={NodeDef.getName(nodeDefPage)}
          id="survey-form-page-label"
          dangerouslySetInnerHTML={{ __html: path }}
        />
      </div>

      <div className="survey-form-header__options">
        {edit && canEditSurvey && <FormHeaderAdvancedButton canEditDef={canEditDef} />}
        <NodeDefLabelSwitch
          labelType={nodeDefLabelType}
          onChange={() => {
            dispatch(SurveyFormActions.updateNodeDefLabelType())
          }}
          size="small"
        />
      </div>
      {analysis && (
        <FormEntryActions
          disableLockUnlock={disableLockUnlock}
          disableValidationReport={disableValidationReport}
          analysis={analysis}
        />
      )}
      {edit && canEditDef ? (
        <FormEditActions />
      ) : (
        <FormEntryActions
          disableLockUnlock={disableLockUnlock}
          disableValidationReport={disableValidationReport}
          preview={preview}
          entry={entry}
        />
      )}
    </div>
  )
}

FormHeader.propTypes = {
  disableLockUnlock: PropTypes.bool,
  disableValidationReport: PropTypes.bool,
  canEditDef: PropTypes.bool.isRequired,
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  preview: PropTypes.bool.isRequired,
  analysis: PropTypes.bool.isRequired,
}

export default FormHeader
