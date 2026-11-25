import './formHeader.scss'
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

import FormEntryActions from '../components/FormEntryActions'
import FormEditActions from '../components/FormEditActions'
import { FormHeaderPath } from './FormHeaderPath'
import FormHeaderAdvancedButton from './FormHeaderAdvancedButton'
import { useAppDispatch } from '@webapp/store'

type FormHeaderProps = {
  disableLockUnlock?: boolean
  disableValidationReport?: boolean
  canEditDef: boolean
  edit: boolean
  entry: boolean
  preview: boolean
  analysis: boolean
}

const FormHeader = (props: FormHeaderProps) => {
  const { disableLockUnlock, disableValidationReport, edit, entry, preview, canEditDef, analysis } = props

  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const surveyIsDirty = useIsSurveyDirty()
  const nodeDefLabelType = useNodeDefLabelType()
  const nodeDefPage = useNodeDefPage()
  const showPageNavigation = useShowPageNavigation()
  const canEditSurvey = useAuthCanEditSurvey()
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

        <FormHeaderPath entry={entry} nodeDefPageName={NodeDef.getName(nodeDefPage)} />
      </div>

      <div className="survey-form-header__options">
        {edit && canEditSurvey && <FormHeaderAdvancedButton canEditDef={canEditDef} />}
        <NodeDefLabelSwitch
          labelType={nodeDefLabelType}
          onChange={() => {
            dispatch(SurveyFormActions.updateNodeDefLabelType())
          }}
        />
      </div>
      {analysis && (
        <FormEntryActions disableLockUnlock={disableLockUnlock} disableValidationReport={disableValidationReport} />
      )}
      {edit && canEditDef ? (
        <FormEditActions />
      ) : (
        <FormEntryActions
          disableLockUnlock={disableLockUnlock}
          disableValidationReport={disableValidationReport}
          entry={entry}
          preview={preview}
        />
      )}
    </div>
  )
}

export default FormHeader
