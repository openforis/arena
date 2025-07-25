import './formHeader.scss'
import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { uuidv4 } from '@core/uuid'
import { FileFormats } from '@core/fileFormats'

import { TreeSelectViewMode } from '@webapp/model'
import { JobActions } from '@webapp/store/app'
import { NodeDefsActions, SurveyActions, useIsSurveyDirty, useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import {
  SurveyFormActions,
  useNodeDefLabelType,
  useNodeDefPage,
  useShowPageNavigation,
  useTreeSelectViewMode,
} from '@webapp/store/ui/surveyForm'
import { TestId } from '@webapp/utils/testId'

import * as API from '@webapp/service/api'

import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'
import { Button, ButtonDownload, ButtonMenu } from '@webapp/components/buttons'
import { OpenFileUploadDialogButton } from '@webapp/components/form'

import FormEntryActions from '../components/formEntryActions'
import FormEditActions from '../components/formEditActions'
import { usePath } from './usePath'
import SurveySchemaSummaryDownloadButton from '../../SurveySchemaSummaryDownloadButton'
import { FileUploadDialogActions } from '@webapp/store/ui'

const labelsExportAllowedFileFormats = [FileFormats.xlsx, FileFormats.csv]

const FormHeader = (props) => {
  const { disableLockUnlock, disableValidationReport, edit, entry, preview, canEditDef, analysis } = props

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()
  const surveyIsDirty = useIsSurveyDirty()
  const nodeDefLabelType = useNodeDefLabelType()
  const nodeDefPage = useNodeDefPage()
  const showPageNavigation = useShowPageNavigation()
  const canEditSurvey = useAuthCanEditSurvey()
  const path = usePath(entry)
  const treeViewMode = useTreeSelectViewMode()

  const onLabelsImportFileSelected = useCallback(
    async (file) => {
      const job = await API.startImportLabelsJob({ surveyId, file })
      dispatch(
        JobActions.showJobMonitor({
          job,
          onComplete: () => {
            dispatch(FileUploadDialogActions.close())
            dispatch(SurveyActions.resetSurveyDefs())
          },
        })
      )
    },
    [dispatch, surveyId]
  )

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
                [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
                  surveyCycleKey,
                  NodeDefLayout.renderType.form,
                  uuidv4()
                ),
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
        {edit && canEditSurvey && (
          <ButtonMenu
            className="btn-menu-advanced"
            disabled={surveyIsDirty}
            iconClassName="icon-cog icon-14px"
            label="common.advancedFunctions"
            items={[
              {
                key: 'schema-summary-csv',
                content: (
                  <SurveySchemaSummaryDownloadButton
                    fileFormat={FileFormats.csv}
                    testId={TestId.surveyForm.schemaSummary}
                  />
                ),
              },
              {
                key: 'schema-summary-excel',
                content: <SurveySchemaSummaryDownloadButton fileFormat={FileFormats.xlsx} />,
              },
              ...labelsExportAllowedFileFormats.map((fileFormat) => ({
                key: `labels-export-${fileFormat}`,
                content: (
                  <ButtonDownload
                    href={`/api/survey/${surveyId}/labels`}
                    label={`surveyForm:exportLabels_${fileFormat}`}
                    requestParams={{ fileFormat }}
                    variant="text"
                  />
                ),
              })),
              {
                key: 'labels-import',
                content: (
                  <OpenFileUploadDialogButton
                    label="surveyForm:importLabels"
                    accept=".csv,.xlsx"
                    onOk={({ files }) => onLabelsImportFileSelected(files[0])}
                    variant="text"
                  />
                ),
              },
            ]}
            size="small"
            testId={TestId.surveyForm.advancedFunctionBtn}
          />
        )}
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
