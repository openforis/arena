import './SurveyInfoBrandingForm.scss'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'

import { Button, ColorInput } from '@webapp/components'
import { Dropdown } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import { useBrandingLogoSrc } from '@webapp/components/survey/useBrandingLogoSrc'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { FileUtils } from '@webapp/utils/fileUtils'

const { keys: brandingKeys, fontSizePreset } = SurveyBranding

const ACCEPTED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const ACCEPTED_LOGO_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg'])
const ACCEPTED_BACKGROUND_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ACCEPTED_BACKGROUND_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

const LOGO_FILE_INPUT_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
const BACKGROUND_FILE_INPUT_ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'

const LANDING_BACKGROUND_MAX_SIZE_MB = SurveyBranding.LANDING_BACKGROUND_MAX_FILE_SIZE_BYTES / (1024 * 1024)

const fieldErrorValidation = (errorKey) => Validation.newInstance(false, {}, [{ key: errorKey }])

const resolvePreviewColor = (primaryColor) => (SurveyBranding.isValidPrimaryColor(primaryColor) ? primaryColor : null)

const isAcceptedFile = (file, acceptedTypes, acceptedExtensions) => {
  if (acceptedTypes.has(file.type)) return true
  const extension = FileUtils.getExtension(file)?.toLowerCase()
  return acceptedExtensions.has(extension)
}

const isAcceptedLogoFile = (file) => isAcceptedFile(file, ACCEPTED_LOGO_TYPES, ACCEPTED_LOGO_EXTENSIONS)

const isAcceptedBackgroundFile = (file) =>
  isAcceptedFile(file, ACCEPTED_BACKGROUND_TYPES, ACCEPTED_BACKGROUND_EXTENSIONS)

const BrandingImageSection = (props) => {
  const {
    imageKey,
    labelKey,
    image,
    urlValue,
    urlValidation,
    localObjectUrl,
    inputRef,
    onFileChange,
    onImageUrlChange,
    onRemove,
    readOnly,
    surveyId,
    uploading,
    fileInputAccept,
    previewVariant = 'logo',
  } = props

  const i18n = useI18n()
  const imageSrc = useBrandingLogoSrc({ surveyId, logo: image, localObjectUrl })
  const hasImage = Boolean(imageSrc || image?.[brandingKeys.fileUuid] || image?.[brandingKeys.url])

  return (
    <fieldset
      className={`survey-info-branding-form__image-section survey-info-branding-form__image-section--${previewVariant}`}
    >
      <legend>{i18n.t(labelKey)}</legend>
      <div className="survey-info-branding-form__image-controls">
        <Input
          value={urlValue}
          onChange={(value) => onImageUrlChange(imageKey, value)}
          readOnly={readOnly}
          validation={urlValidation}
          placeholder={i18n.t('homeView:surveyInfo.branding.logoUrl')}
        />
        {!readOnly && (
          <div className="survey-info-branding-form__upload-actions">
            <div className="survey-info-branding-form__upload">
              <input
                ref={inputRef}
                accept={fileInputAccept}
                className="survey-info-branding-form__file-input"
                onChange={onFileChange}
                type="file"
              />
              <Button
                disabled={uploading}
                label="homeView:surveyInfo.branding.uploadLogo"
                onClick={() => inputRef.current?.click()}
                size="small"
              />
            </div>
            {hasImage && onRemove && (
              <Button label="common:delete" onClick={() => onRemove(imageKey)} size="small" />
            )}
          </div>
        )}
      </div>
      {imageSrc && (
        <div className={`survey-info-branding-form__image-preview survey-info-branding-form__image-preview--${previewVariant}`}>
          <img alt="" src={imageSrc} />
        </div>
      )}
    </fieldset>
  )
}

BrandingImageSection.propTypes = {
  imageKey: PropTypes.string.isRequired,
  labelKey: PropTypes.string.isRequired,
  image: PropTypes.object,
  urlValue: PropTypes.string,
  urlValidation: PropTypes.object,
  localObjectUrl: PropTypes.string,
  inputRef: PropTypes.object.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onImageUrlChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func,
  readOnly: PropTypes.bool,
  surveyId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  uploading: PropTypes.bool,
  fileInputAccept: PropTypes.string.isRequired,
  previewVariant: PropTypes.oneOf(['logo', 'background']),
}

export const SurveyInfoBrandingForm = (props) => {
  const { branding = {}, setBranding, readOnly } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()

  const surveyLogoInputRef = useRef(null)
  const countryLogoInputRef = useRef(null)
  const landingBackgroundInputRef = useRef(null)
  const [uploadingImageKey, setUploadingImageKey] = useState(null)
  const [localObjectUrls, setLocalObjectUrls] = useState({})

  const {
    primaryColor = '',
    surveyLogo = {},
    countryLogo = {},
    landingBackground = {},
    titleFontSize = fontSizePreset.default,
    descriptionFontSize = fontSizePreset.default,
  } = branding

  const surveyLogoSrc = useBrandingLogoSrc({
    surveyId,
    logo: surveyLogo,
    localObjectUrl: localObjectUrls[brandingKeys.surveyLogo] ?? null,
  })
  const countryLogoSrc = useBrandingLogoSrc({
    surveyId,
    logo: countryLogo,
    localObjectUrl: localObjectUrls[brandingKeys.countryLogo] ?? null,
  })
  const landingBackgroundSrc = useBrandingLogoSrc({
    surveyId,
    logo: landingBackground,
    localObjectUrl: localObjectUrls[brandingKeys.landingBackground] ?? null,
  })

  const previewColor = resolvePreviewColor(primaryColor)
  const previewTitleStyle = { fontSize: SurveyBranding.getTitleFontSizeRem({ props: { branding } }) }
  const previewDescriptionStyle = {
    fontSize: SurveyBranding.getDescriptionFontSizeRem({ props: { branding } }),
  }

  useEffect(
    () => () => {
      Object.values(localObjectUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    },
    // revoke only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const setLocalObjectUrl = useCallback((imageKey, file) => {
    setLocalObjectUrls((prev) => {
      if (prev[imageKey]) URL.revokeObjectURL(prev[imageKey])
      return { ...prev, [imageKey]: URL.createObjectURL(file) }
    })
  }, [])

  const clearLocalObjectUrl = useCallback((imageKey) => {
    setLocalObjectUrls((prev) => {
      if (prev[imageKey]) URL.revokeObjectURL(prev[imageKey])
      const next = { ...prev }
      delete next[imageKey]
      return next
    })
  }, [])

  const primaryColorValidation = useMemo(() => {
    if (!primaryColor) return null
    if (SurveyBranding.isValidPrimaryColor(primaryColor)) return null
    return fieldErrorValidation('homeView:surveyInfo.branding.invalidPrimaryColor')
  }, [primaryColor])

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

  const landingBackgroundUrlValidation = useMemo(() => {
    const url = landingBackground[brandingKeys.url]
    if (!url) return null
    if (SurveyBranding.isValidLogoUrl(url)) return null
    return fieldErrorValidation('homeView:surveyInfo.branding.invalidLogoUrl')
  }, [landingBackground])

  const fontSizePresetOptions = useMemo(() => SurveyBranding.fontSizePresetValues, [])

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

  const onImageUrlChange = useCallback(
    (imageKey, value) => {
      clearLocalObjectUrl(imageKey)
      const next = { ...branding }
      if (!value.trim()) {
        next[imageKey] = {}
      } else {
        next[imageKey] = { [brandingKeys.url]: value }
      }
      setBranding(next)
    },
    [branding, clearLocalObjectUrl, setBranding]
  )

  const onFontSizePresetChange = useCallback(
    (fieldKey, value) => {
      const next = { ...branding }
      if (!value || value === fontSizePreset.default) {
        delete next[fieldKey]
      } else {
        next[fieldKey] = value
      }
      setBranding(next)
    },
    [branding, setBranding]
  )

  const onImageRemove = useCallback(
    (imageKey) => {
      clearLocalObjectUrl(imageKey)
      setBranding({ ...branding, [imageKey]: {} })
    },
    [branding, clearLocalObjectUrl, setBranding]
  )

  const onImageFileSelected = useCallback(
    async ({ imageKey, fileType, file, validateFile }) => {
      if (!file) return

      const validationError = validateFile(file)
      if (validationError) {
        dispatch(
          NotificationActions.notifyWarning({
            key: validationError.key,
            params: validationError.params,
          })
        )
        return
      }

      setUploadingImageKey(imageKey)
      setLocalObjectUrl(imageKey, file)
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
          [imageKey]: { [brandingKeys.fileUuid]: SurveyFile.getUuid(surveyFile) },
        })
      } catch (error) {
        clearLocalObjectUrl(imageKey)
        dispatch(
          NotificationActions.notifyError({
            key: 'appErrors:generic',
            params: { text: String(error?.message || error) },
          })
        )
      } finally {
        setUploadingImageKey(null)
      }
    },
    [branding, clearLocalObjectUrl, dispatch, setBranding, setLocalObjectUrl, surveyId]
  )

  const validateLogoFile = useCallback((file) => {
    if (!isAcceptedLogoFile(file)) {
      return {
        key: 'dropzone.error.invalidFileExtension',
        params: { extension: FileUtils.getExtension(file) },
      }
    }
    return null
  }, [])

  const validateBackgroundFile = useCallback((file) => {
    if (!isAcceptedBackgroundFile(file)) {
      return {
        key: 'dropzone.error.invalidFileExtension',
        params: { extension: FileUtils.getExtension(file) },
      }
    }
    if (file.size > SurveyBranding.LANDING_BACKGROUND_MAX_FILE_SIZE_BYTES) {
      return {
        key: 'homeView:surveyInfo.branding.backgroundFileTooLarge',
        params: { maxMb: LANDING_BACKGROUND_MAX_SIZE_MB },
      }
    }
    return null
  }, [])

  const onSurveyLogoFileChange = useCallback(
    (event) => {
      onImageFileSelected({
        imageKey: brandingKeys.surveyLogo,
        fileType: SurveyFile.SurveyFileType.brandingSurveyLogo,
        file: event.target.files?.[0],
        validateFile: validateLogoFile,
      })
      event.target.value = ''
    },
    [onImageFileSelected, validateLogoFile]
  )

  const onCountryLogoFileChange = useCallback(
    (event) => {
      onImageFileSelected({
        imageKey: brandingKeys.countryLogo,
        fileType: SurveyFile.SurveyFileType.brandingCountryLogo,
        file: event.target.files?.[0],
        validateFile: validateLogoFile,
      })
      event.target.value = ''
    },
    [onImageFileSelected, validateLogoFile]
  )

  const onLandingBackgroundFileChange = useCallback(
    (event) => {
      onImageFileSelected({
        imageKey: brandingKeys.landingBackground,
        fileType: SurveyFile.SurveyFileType.brandingLandingBackground,
        file: event.target.files?.[0],
        validateFile: validateBackgroundFile,
      })
      event.target.value = ''
    },
    [onImageFileSelected, validateBackgroundFile]
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

      <FormItem label="homeView:surveyInfo.branding.titleFontSize">
        <Dropdown
          disabled={readOnly}
          items={fontSizePresetOptions}
          itemLabel={(preset) => i18n.t(`homeView:surveyInfo.branding.fontSizePreset.${preset}`)}
          itemValue={A.identity}
          onChange={(value) => onFontSizePresetChange(brandingKeys.titleFontSize, value)}
          readOnly={readOnly}
          selection={titleFontSize}
        />
      </FormItem>

      <FormItem label="homeView:surveyInfo.branding.descriptionFontSize">
        <Dropdown
          disabled={readOnly}
          items={fontSizePresetOptions}
          itemLabel={(preset) => i18n.t(`homeView:surveyInfo.branding.fontSizePreset.${preset}`)}
          itemValue={A.identity}
          onChange={(value) => onFontSizePresetChange(brandingKeys.descriptionFontSize, value)}
          readOnly={readOnly}
          selection={descriptionFontSize}
        />
      </FormItem>

      <div className="survey-info-branding-form__logos">
        <BrandingImageSection
          imageKey={brandingKeys.surveyLogo}
          labelKey="homeView:surveyInfo.branding.surveyLogo"
          image={surveyLogo}
          urlValue={surveyLogo[brandingKeys.url] ?? ''}
          urlValidation={surveyLogoUrlValidation}
          localObjectUrl={localObjectUrls[brandingKeys.surveyLogo] ?? null}
          inputRef={surveyLogoInputRef}
          onFileChange={onSurveyLogoFileChange}
          onImageUrlChange={onImageUrlChange}
          readOnly={readOnly}
          surveyId={surveyId}
          uploading={uploadingImageKey === brandingKeys.surveyLogo}
          fileInputAccept={LOGO_FILE_INPUT_ACCEPT}
        />

        <BrandingImageSection
          imageKey={brandingKeys.countryLogo}
          labelKey="homeView:surveyInfo.branding.countryLogo"
          image={countryLogo}
          urlValue={countryLogo[brandingKeys.url] ?? ''}
          urlValidation={countryLogoUrlValidation}
          localObjectUrl={localObjectUrls[brandingKeys.countryLogo] ?? null}
          inputRef={countryLogoInputRef}
          onFileChange={onCountryLogoFileChange}
          onImageUrlChange={onImageUrlChange}
          readOnly={readOnly}
          surveyId={surveyId}
          uploading={uploadingImageKey === brandingKeys.countryLogo}
          fileInputAccept={LOGO_FILE_INPUT_ACCEPT}
        />
      </div>

      <BrandingImageSection
        imageKey={brandingKeys.landingBackground}
        labelKey="homeView:surveyInfo.branding.landingBackground"
        image={landingBackground}
        urlValue={landingBackground[brandingKeys.url] ?? ''}
        urlValidation={landingBackgroundUrlValidation}
        localObjectUrl={localObjectUrls[brandingKeys.landingBackground] ?? null}
        inputRef={landingBackgroundInputRef}
        onFileChange={onLandingBackgroundFileChange}
        onImageUrlChange={onImageUrlChange}
        onRemove={readOnly ? null : onImageRemove}
        readOnly={readOnly}
        surveyId={surveyId}
        uploading={uploadingImageKey === brandingKeys.landingBackground}
        fileInputAccept={BACKGROUND_FILE_INPUT_ACCEPT}
        previewVariant="background"
      />

      <fieldset className="survey-info-branding-form__preview">
        <legend>{i18n.t('homeView:surveyInfo.branding.preview')}</legend>
        <div
          className={`survey-info-branding-form__preview-landing${
            landingBackgroundSrc ? ' survey-info-branding-form__preview-landing--with-background' : ''
          }`}
          style={landingBackgroundSrc ? { backgroundImage: `url(${landingBackgroundSrc})` } : undefined}
        >
          <div className="survey-info-branding-form__preview-content">
            {countryLogoSrc && <img alt="" className="survey-info-branding-form__preview-logo" src={countryLogoSrc} />}
            {surveyLogoSrc && <img alt="" className="survey-info-branding-form__preview-logo" src={surveyLogoSrc} />}
            <p className="survey-info-branding-form__preview-title" style={previewTitleStyle}>
              {i18n.t('homeView:surveyInfo.branding.previewTitle')}
            </p>
            <p className="survey-info-branding-form__preview-description" style={previewDescriptionStyle}>
              {i18n.t('homeView:surveyInfo.branding.previewDescription')}
            </p>
            <Button
              color="primary"
              label="common:appModules.records"
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
        </div>
      </fieldset>
    </div>
  )
}

SurveyInfoBrandingForm.propTypes = {
  branding: PropTypes.object,
  setBranding: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
}
