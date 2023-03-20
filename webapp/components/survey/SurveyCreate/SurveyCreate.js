import './SurveyCreate.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'

import * as A from '@core/arena'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import { Input } from '@webapp/components/form/Input'
import LanguageDropdown from '@webapp/components/form/languageDropdown'
import UploadButton from '@webapp/components/form/uploadButton'
import { useOnUpdate } from '@webapp/components/hooks'
import { Checkbox } from '@webapp/components/form'
import { ProgressBar } from '@webapp/components'

import { createTypes, useCreateSurvey } from './store'
import { SurveyDropdown } from '../SurveyDropdown'

const SurveyCreate = (props) => {
  const { showImport, submitButtonLabel, template } = props

  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const navigate = useNavigate()

  const { newSurvey, onUpdate, onCreate, onImport, onCreateTypeUpdate, onOptionUpdate } = useCreateSurvey({ template })
  const { createType, name, label, lang, validation, cloneFrom, options, uploadProgressPercent } = newSurvey

  // Redirect to dashboard on survey change
  useOnUpdate(() => {
    navigate(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  return (
    <div className="home-survey-create">
      <div className="row">
        <ButtonGroup
          groupName={template ? 'templateCreateType' : 'surveyCreateType'}
          selectedItemKey={createType}
          onChange={onCreateTypeUpdate}
          items={[
            {
              key: createTypes.fromScratch,
              label: i18n.t(
                template ? 'homeView.surveyCreate.newTemplateFromScratch' : 'homeView.surveyCreate.newSurveyFromScratch'
              ),
            },
            {
              key: createTypes.clone,
              label: i18n.t('common.clone'),
            },
            ...(showImport
              ? [
                  {
                    key: createTypes.import,
                    label: i18n.t('common.import'),
                  },
                ]
              : []),
          ]}
        />
      </div>
      <div className="row">
        <Input
          id={TestId.surveyCreate.surveyName}
          placeholder={i18n.t('common.name')}
          value={name}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={(value) => onUpdate({ name: 'name', value: StringUtils.normalizeName(value) })}
        />
      </div>
      {createType === createTypes.fromScratch && (
        <>
          <div className="row">
            <Input
              id={TestId.surveyCreate.surveyLabel}
              placeholder={i18n.t('common.label')}
              value={label}
              validation={Validation.getFieldValidation('label')(validation)}
              onChange={(value) => onUpdate({ name: 'label', value })}
            />
          </div>
          <div className="row">
            <LanguageDropdown
              selection={lang}
              validation={Validation.getFieldValidation('lang')(validation)}
              onChange={(value) => onUpdate({ name: 'lang', value })}
              disabled={!A.isEmpty(cloneFrom)}
            />
          </div>
        </>
      )}

      {createType === createTypes.clone && (
        <div className="row">
          <SurveyDropdown selection={cloneFrom} onChange={(value) => onUpdate({ name: 'cloneFrom', value })} />
        </div>
      )}

      {createType !== createTypes.import && (
        <div className="row">
          <button
            data-testid={TestId.surveyCreate.submitBtn}
            type="button"
            className="btn"
            onClick={onCreate}
            disabled={createType === createTypes.clone && !cloneFrom}
          >
            <span className="icon icon-plus icon-left icon-12px" />
            {i18n.t(submitButtonLabel)}
          </button>
        </div>
      )}

      {createType === createTypes.import && showImport && (
        <>
          {uploadProgressPercent >= 0 ? (
            <div className="row">
              <ProgressBar progress={uploadProgressPercent} />
            </div>
          ) : (
            <>
              <div className="row">
                <fieldset className="options-fieldset">
                  <legend>{i18n.t('common.options')}</legend>
                  <div>
                    <Checkbox
                      checked={options['includeData']}
                      label={`homeView.surveyCreate.options.includeData`}
                      onChange={(value) => onOptionUpdate({ key: 'includeData', value })}
                    />
                  </div>
                </fieldset>
              </div>
              <div className="row">
                <UploadButton
                  inputFieldId={TestId.surveyCreate.importFromArena}
                  label={i18n.t('homeView.surveyCreate.importFromArena')}
                  accept=".zip"
                  maxSize={1000}
                  onChange={(files) => onImport.Arena({ file: files[0] })}
                />
              </div>
              <div className="row">
                <UploadButton
                  inputFieldId={TestId.surveyCreate.importFromCollect}
                  label={i18n.t('homeView.surveyCreate.importFromCollect')}
                  accept=".collect,.collect-backup"
                  maxSize={1000}
                  onChange={(files) => onImport.Collect({ file: files[0] })}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

SurveyCreate.propTypes = {
  showImport: PropTypes.bool,
  submitButtonLabel: PropTypes.string,
  template: PropTypes.bool,
}

SurveyCreate.defaultProps = {
  showImport: true,
  submitButtonLabel: 'homeView.surveyCreate.createSurvey',
  template: false,
}

export { SurveyCreate }
