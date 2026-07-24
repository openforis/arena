import './SurveyInfoBrandingForm.scss'

import { useCallback, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'

import { Button, ColorInput } from '@webapp/components'
import { FormItem, Input } from '@webapp/components/form/Input'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { FileUtils } from '@webapp/utils/fileUtils'

const { keys: brandingKeys } = SurveyBranding

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

const fieldErrorValidation = (errorKey) => Validation.newInstance(false, {}, [{ key: errorKey }])

const resolvePreviewColor = (primaryColor) => (SurveyBranding.isValidPrimaryColor(primaryColor) ? primaryColor : null)

const FILE_INPUT_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'

export const SurveyInfoBrandingForm = (props) => {
  const { branding = {}, setBranding, getFieldValidation, readOnly } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()

  const surveyLogoInputRef = useRef(null)
  const countryLogoInputRef = useRef(null)
  const [uploadingLogoKey, setUploadingLogoKey] = useState(null)

  const { primaryColor = '', surveyLogo = {}, countryLogo = {} } = branding

  const surveyLogoSrc = useMemo(
    () =>
      SurveyBranding.resolveLogoSrc(surveyLogo, {
        surveyId,
        getFileDownloadUrl: API.getSurveyFileDownloadUrl,
      }),
    [surveyId, surveyLogo]
  )

  const countryLogoSrc = useMemo(
    () =>
      SurveyBranding.resolveLogoSrc(countryLogo, {
        surveyId,
        getFileDownloadUrl: API.getSurveyFileDownloadUrl,
      }),
    [countryLogo, surveyId]
  )

  const previewColor = resolvePreviewColor(primaryColor)

  const primaryColorValidation = useMemo(() => {
    if (!primaryColor) return getFieldValidation(Survey.infoKeys.branding)
    if (SurveyBranding.isValidPrimaryColor(primaryColor)) return null
    return fieldErrorValidation('homeView:surveyInfo.branding.invalidPrimaryColor')
  }, [getFieldValidation, primaryColor])

  const surveyLogoUrlValidation = useMemo(() => {
    const url = surveyLogo[brandingKeys.url]
    if (!url) return null
    if (SurveyBranding.isValidLogoUrl(url)) return null
    return fieldErrorValidation('homeView:surveyInfo.branding.invalidLogoUrl')
  }, [surveyLogo])

  const countryLogoUrlValidation = useMemo(() => {
    const url = countryLogo[brandingKeys.url]
    if (!url) return null
    if (SurveyBranding.isValidLogoUrl(url)) return null
    return fieldErrorValidation('homeView:surveyInfo.branding.invalidLogoUrl')
  }, [countryLogo])

  const onPrimaryColorChange = useCallback(
    (value) => {
      const next = { ...branding }
      if (!value?.trim()) {
        delete next[brandingKeys.primaryColor]
      } else {
        next[brandingKeys.primaryColor] = value
      }
      setBranding(next)
    },
    [branding, setBranding]
  )

  const onLogoUrlChange = useCallback(
    (logoKey, value) => {
      const next = { ...branding }
      if (!value.trim()) {
        next[logoKey] = {}
      } else {
        next[logoKey] = { [brandingKeys.url]: value }
      }
      setBranding(next)
    },
    [branding, setBranding]
  )

  const onLogoFileSelected = useCallback(
    async (logoKey, fileType, file) => {
      if (!file) return

      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        dispatch(
          NotificationActions.notifyWarning({
            key: 'dropzone.error.invalidFileExtension',
            params: { extension: FileUtils.getExtension(file) },
          })
        )
        return
      }

      setUploadingLogoKey(logoKey)
      try {
        const surveyFile = SurveyFile.createFile({
          type: fileType,
          temporary: true,
          name: file.name,
          size: file.size,
        })
        await API.insertSurveyFile({ surveyId, file, surveyFile })
        setBranding({
          ...branding,
          [logoKey]: { [brandingKeys.fileUuid]: SurveyFile.getUuid(surveyFile) },
        })
      } finally {
        setUploadingLogoKey(null)
      }
    },
    [branding, dispatch, setBranding, surveyId]
  )

  const onSurveyLogoFileChange = useCallback(
    (event) => {
      onLogoFileSelected(brandingKeys.surveyLogo, SurveyFile.SurveyFileType.brandingSurveyLogo, event.target.files?.[0])
      event.target.value = ''
    },
    [onLogoFileSelected]
  )

  const onCountryLogoFileChange = useCallback(
    (event) => {
      onLogoFileSelected(
        brandingKeys.countryLogo,
        SurveyFile.SurveyFileType.brandingCountryLogo,
        event.target.files?.[0]
      )
      event.target.value = ''
    },
    [onLogoFileSelected]
  )

  const renderLogoSection = ({ logoKey, labelKey, urlValue, urlValidation, logoSrc, inputRef, onFileChange }) => (
    <fieldset className="survey-info-branding-form__logo-section" key={logoKey}>
      <legend>{i18n.t(labelKey)}</legend>
      <div className="survey-info-branding-form__logo-controls">
        <Input
          value={urlValue}
          onChange={(value) => onLogoUrlChange(logoKey, value)}
          readOnly={readOnly}
          validation={urlValidation}
          placeholder={i18n.t('homeView:surveyInfo.branding.logoUrl')}
        />
        {!readOnly && (
          <div className="survey-info-branding-form__upload">
            <input
              ref={inputRef}
              accept={FILE_INPUT_ACCEPT}
              className="survey-info-branding-form__file-input"
              onChange={onFileChange}
              type="file"
            />
            <Button
              disabled={uploadingLogoKey === logoKey}
              label="homeView:surveyInfo.branding.uploadLogo"
              onClick={() => inputRef.current?.click()}
              size="small"
            />
          </div>
        )}
      </div>
      {logoSrc && (
        <div className="survey-info-branding-form__logo-preview">
          <img alt="" src={logoSrc} />
        </div>
      )}
    </fieldset>
  )

  return (
    <div className="form survey-info-branding-form">
      <FormItem label="homeView:surveyInfo.branding.primaryColor">
        <ColorInput disabled={readOnly} onChange={onPrimaryColorChange} value={primaryColor || ''} />
        {primaryColorValidation && (
          <span className="survey-info-branding-form__field-error">
            {i18n.t('homeView:surveyInfo.branding.invalidPrimaryColor')}
          </span>
        )}
      </FormItem>

      <div className="survey-info-branding-form__logos">
        {renderLogoSection({
          logoKey: brandingKeys.surveyLogo,
          labelKey: 'homeView:surveyInfo.branding.surveyLogo',
          urlValue: surveyLogo[brandingKeys.url] ?? '',
          urlValidation: surveyLogoUrlValidation,
          logoSrc: surveyLogoSrc,
          inputRef: surveyLogoInputRef,
          onFileChange: onSurveyLogoFileChange,
        })}

        {renderLogoSection({
          logoKey: brandingKeys.countryLogo,
          labelKey: 'homeView:surveyInfo.branding.countryLogo',
          urlValue: countryLogo[brandingKeys.url] ?? '',
          urlValidation: countryLogoUrlValidation,
          logoSrc: countryLogoSrc,
          inputRef: countryLogoInputRef,
          onFileChange: onCountryLogoFileChange,
        })}
      </div>

      <fieldset className="survey-info-branding-form__preview">
        <legend>{i18n.t('homeView:surveyInfo.branding.preview')}</legend>
        <div className="survey-info-branding-form__preview-content">
          {countryLogoSrc && <img alt="" className="survey-info-branding-form__preview-logo" src={countryLogoSrc} />}
          {surveyLogoSrc && <img alt="" className="survey-info-branding-form__preview-logo" src={surveyLogoSrc} />}
          <Button
            color="primary"
            label="homeView:landing.enter"
            sx={
              previewColor
                ? {
                    backgroundColor: previewColor,
                    '&:hover': { backgroundColor: previewColor },
                  }
                : undefined
            }
          />
        </div>
      </fieldset>
    </div>
  )
}

SurveyInfoBrandingForm.propTypes = {
  branding: PropTypes.object,
  setBranding: PropTypes.func.isRequired,
  getFieldValidation: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
}
