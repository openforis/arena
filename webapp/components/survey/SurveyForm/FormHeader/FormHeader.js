import './formHeader.scss'
import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { uuidv4 } from '@core/uuid'

import { useI18n } from '@webapp/store/system'
import { NodeDefsActions, useSurveyCycleKey, useSurveyId } from '@webapp/store/survey'
import {
  SurveyFormActions,
  useNodeDefLabelType,
  useNodeDefPage,
  useShowPageNavigation,
} from '@webapp/store/ui/surveyForm'
import { DataTestId } from '@webapp/utils/dataTestId'

import DownloadButton from '@webapp/components/form/downloadButton'
import NodeDefLabelSwitch from '@webapp/components/survey/NodeDefLabelSwitch'

import FormEntryActions from '../components/formEntryActions'
import FormEditActions from '../components/formEditActions'
import { usePath } from './usePath'

const FormHeader = (props) => {
  const { canEditRecord, edit, entry, preview, canEditDef, analysis } = props

  const dispatch = useDispatch()
  const history = useHistory()
  const i18n = useI18n()

  const surveyId = useSurveyId()
  const surveyCycleKey = useSurveyCycleKey()
  const nodeDefLabelType = useNodeDefLabelType()
  const nodeDefPage = useNodeDefPage()
  const showPageNavigation = useShowPageNavigation()
  const path = usePath(entry)

  return (
    <div className="survey-form-header">
      <div className="survey-form-header__label-container">
        <button
          type="button"
          className="btn-s btn-transparent"
          onClick={() => dispatch(SurveyFormActions.toggleFormPageNavigation())}
          title={i18n.t(`surveyForm.${showPageNavigation ? 'hide' : 'show'}Pages`)}
        >
          <span className="icon icon-stack icon-12px icon-left" />
          <span className={`icon icon-${showPageNavigation ? 'shrink2' : 'enlarge2'} icon-12px`} />
        </button>

        {edit && canEditDef && (
          <button
            type="button"
            className="btn-s btn-transparent"
            data-testid={DataTestId.surveyForm.addSubPageBtn}
            onClick={() => {
              const propsNodeDef = {
                [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
                  surveyCycleKey,
                  NodeDefLayout.renderType.form,
                  uuidv4()
                ),
              }
              dispatch(NodeDefsActions.createNodeDef(nodeDefPage, NodeDef.nodeDefType.entity, propsNodeDef, history))
            }}
          >
            <span className="icon icon-plus icon-12px icon-left" />
            {i18n.t('surveyForm.subPage')}
          </button>
        )}

        <div
          className="survey-form-header__path"
          data-nodedef-name={NodeDef.getName(nodeDefPage)}
          id="survey-form-page-label"
          dangerouslySetInnerHTML={{ __html: path }}
        />
      </div>

      <div className="survey-form-header__options">
        {edit && (
          <DownloadButton
            id={DataTestId.surveyForm.schemaSummary}
            href={`/api/survey/${surveyId}/schema-summary/`}
            label={i18n.t('surveyForm.schemaSummary')}
          />
        )}
        <NodeDefLabelSwitch
          className="btn-s btn-transparent"
          labelType={nodeDefLabelType}
          onChange={() => {
            dispatch(SurveyFormActions.updateNodeDefLabelType())
          }}
        />
        <div> | </div>
      </div>
      {analysis && <FormEntryActions analysis={analysis} />}
      {edit && canEditDef ? (
        <FormEditActions />
      ) : (
        <FormEntryActions preview={preview} entry={entry} canEditRecord={canEditRecord} />
      )}
    </div>
  )
}

FormHeader.propTypes = {
  canEditDef: PropTypes.bool.isRequired,
  canEditRecord: PropTypes.bool.isRequired,
  edit: PropTypes.bool.isRequired,
  entry: PropTypes.bool.isRequired,
  preview: PropTypes.bool.isRequired,
  analysis: PropTypes.bool.isRequired,
}

export default FormHeader
