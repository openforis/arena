import './SurveyCreate.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'

import * as A from '@core/arena'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { RecordCycle } from '@core/record/recordCycle'

import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'
import { contentTypes } from '@webapp/service/api'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import { FormItem, Input } from '@webapp/components/form/Input'
import LanguageDropdown from '@webapp/components/form/languageDropdown'
import { useOnUpdate } from '@webapp/components/hooks'
import { Checkbox, Dropdown } from '@webapp/components/form'
import { Button, Dropzone, ProgressBar, RadioButtonGroup } from '@webapp/components'

import { createTypes, importSources, useCreateSurvey } from './store'
import { SurveyDropdown } from '../SurveyDropdown'
import { useUserIsSystemAdmin } from '@webapp/store/user'

const fileMaxSizeDefault = 1000 // 1GB
const fileMaxSizeSystemAdmin = 2000 // 2GB

const SurveyCreate = (props) => {
  const { showImport = true, submitButtonLabel = 'homeView.surveyCreate.createSurvey', template = false } = props

  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const navigate = useNavigate()
  const isSystemAdmin = useUserIsSystemAdmin()

  const { newSurvey, onUpdate, onCreate, onImport, onCreateTypeUpdate, onFilesDrop, onOptionChange, onSourceChange } =
    useCreateSurvey({
      template,
    })
  const {
    createType,
    name,
    label,
    lang,
    source,
    validation,
    cloneFrom,
    cloneFromCycle,
    options,
    file,
    uploading,
    uploadProgressPercent,
  } = newSurvey

  // Redirect to dashboard on survey change
  useOnUpdate(() => {
    navigate(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  const fileMaxSize = isSystemAdmin ? fileMaxSizeSystemAdmin : fileMaxSizeDefault

  return (
    <div className="home-survey-create">
      <div className="row">
        <ButtonGroup
          disabled={uploading}
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
      <FormItem label={i18n.t('common.name')}>
        <Input
          disabled={uploading}
          id={TestId.surveyCreate.surveyName}
          value={name}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={(value) => onUpdate({ name: 'name', value: StringUtils.normalizeName(value) })}
        />
      </FormItem>
      {createType === createTypes.fromScratch && (
        <>
          <FormItem label={i18n.t('common.label')}>
            <Input
              id={TestId.surveyCreate.surveyLabel}
              value={label}
              validation={Validation.getFieldValidation('label')(validation)}
              onChange={(value) => onUpdate({ name: 'label', value })}
            />
          </FormItem>
          <FormItem label={i18n.t('common.language')}>
            <LanguageDropdown
              selection={lang}
              validation={Validation.getFieldValidation('lang')(validation)}
              onChange={(value) => onUpdate({ name: 'lang', value })}
              disabled={!A.isEmpty(cloneFrom)}
            />
          </FormItem>
        </>
      )}

      {createType === createTypes.clone && (
        <>
          <FormItem label={i18n.t('common.cloneFrom')}>
            <SurveyDropdown
              selection={cloneFrom?.value}
              onChange={(value) => {
                const cycles = value?.cycles || []
                const lastCycleKey = cycles[cycles.length - 1]
                onUpdate({ name: 'cloneFrom', value }, { name: 'cloneFromCycle', value: lastCycleKey })
              }}
            />
          </FormItem>
          {cloneFrom?.cycles?.length > 1 && (
            <FormItem label={i18n.t('common.cycle')}>
              <Dropdown
                className="cycle-dropdown"
                items={cloneFrom.cycles}
                itemValue={(cycleKey) => cycleKey}
                itemLabel={RecordCycle.getLabel}
                onChange={(cycleKey) => onUpdate({ name: 'cloneFromCycle', value: cycleKey })}
                selection={cloneFromCycle}
                validation={Validation.getFieldValidation('cloneFromCycle')(validation)}
              />
            </FormItem>
          )}
        </>
      )}

      {createType !== createTypes.import && (
        <div className="row">
          <Button
            disabled={createType === createTypes.clone && !cloneFrom}
            iconClassName="icon-plus icon-12px"
            label={submitButtonLabel}
            onClick={onCreate}
            testId={TestId.surveyCreate.submitBtn}
          />
        </div>
      )}

      {createType === createTypes.import && showImport && (
        <>
          {uploading && uploadProgressPercent >= 0 ? (
            <div className="row">
              <ProgressBar indeterminate={false} progress={uploadProgressPercent} />
            </div>
          ) : (
            <>
              <div className="row">
                <fieldset className="options-fieldset">
                  <legend>{i18n.t('common.options')}</legend>
                  <div>
                    <Checkbox
                      id={TestId.surveyCreate.optionIncludeDataCheckbox}
                      checked={options['includeData']}
                      label={`homeView.surveyCreate.options.includeData`}
                      onChange={(value) => onOptionChange({ key: 'includeData', value })}
                    />
                  </div>
                </fieldset>
              </div>
              <FormItem label={i18n.t('homeView.surveyCreate.source.label')}>
                <RadioButtonGroup
                  items={Object.values(importSources).map((key) => ({
                    key,
                    label: `homeView.surveyCreate.source.${key}`,
                  }))}
                  onChange={onSourceChange}
                  row
                  value={source}
                />
              </FormItem>
              <div className="row">
                <Dropzone
                  accept={
                    source === importSources.arena
                      ? { [contentTypes.zip]: ['.zip'] }
                      : { [contentTypes.zip]: ['.collect', '.collect-backup', '.collect-data'] }
                  }
                  maxSize={fileMaxSize}
                  onDrop={onFilesDrop}
                  droppedFiles={file ? [file] : []}
                />
              </div>
              <div className="row">
                <Button
                  className="btn-primary"
                  disabled={!file || uploading}
                  label={'homeView.surveyCreate.startImport'}
                  onClick={onImport}
                  testId={TestId.surveyCreate.startImportBtn}
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

export { SurveyCreate }
