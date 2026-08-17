import './SurveyInfoBrandingForm.scss'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as SurveyBranding from '@core/survey/surveyBranding'
import type {
  BrandingImageDescriptor,
  FontSizePreset,
  SurveyBranding as SurveyBrandingData,
  SurveyLogoKey,
} from '@core/survey/surveyBranding'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import type { ValidationResultInstance } from '@core/validation/validationResult'

import { Button, ButtonIconDelete, ColorInput } from '@webapp/components'
import { Dropdown } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useConfirmAsync } from '@webapp/components/hooks'
import { useBrandingLogoSrc } from '@webapp/components/survey/useBrandingLogoSrc'
import * as API from '@webapp/service/api'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { NotificationActions } from '@webapp/store/ui'
import { defaultTokens } from '@webapp/theme/tokens'
import { FileUtils } from '@webapp/utils/fileUtils'

const { keys: brandingKeys, fontSizePreset } = SurveyBranding

const ACCEPTED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const ACCEPTED_LOGO_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg'])
const ACCEPTED_BACKGROUND_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const ACCEPTED_BACKGROUND_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

const LOGO_FILE_INPUT_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg'
const BACKGROUND_FILE_INPUT_ACCEPT = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'

const LANDING_BACKGROUND_MAX_SIZE_MB = SurveyBranding.LANDING_BACKGROUND_MAX_FILE_SIZE_BYTES / (1024 * 1024)
const LOGO_MAX_SIZE_MB = SurveyBranding.BRANDING_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024)
const DEFAULT_PREVIEW_BUTTON_COLOR = defaultTokens.colors.blue

type BrandingImageKey = SurveyLogoKey | typeof brandingKeys.landingBackground

type LogoSlotConfig = {
  imageKey: SurveyLogoKey
  labelKey: string
  fileType: string
}

const LOGO_SLOTS: LogoSlotConfig[] = [
  {
    imageKey: brandingKeys.surveyLogo1,
    labelKey: 'homeView:surveyInfo.branding.surveyLogo1',
    fileType: SurveyFile.SurveyFileType.brandingSurveyLogo1,
  },
  {
    imageKey: brandingKeys.surveyLogo2,
    labelKey: 'homeView:surveyInfo.branding.surveyLogo2',
    fileType: SurveyFile.SurveyFileType.brandingSurveyLogo2,
  },
  {
    imageKey: brandingKeys.surveyLogo3,
    labelKey: 'homeView:surveyInfo.branding.surveyLogo3',
    fileType: SurveyFile.SurveyFileType.brandingSurveyLogo3,
  },
]

type FileValidationError = {
  key: string
  params?: Record<string, unknown>
}

const fieldErrorValidation = (errorKey: string): ValidationResultInstance =>
  Validation.newInstance(false, {}, [{ key: errorKey }]) as ValidationResultInstance

const resolvePreviewColor = (primaryColor: string): string | null =>
  SurveyBranding.isValidPrimaryColor(primaryColor) ? primaryColor : null

const isAcceptedFile = (file: File, acceptedTypes: Set<string>, acceptedExtensions: Set<string>): boolean => {
  if (acceptedTypes.has(file.type)) return true
  const extension = FileUtils.getExtension(file)?.toLowerCase()
  return extension ? acceptedExtensions.has(extension) : false
}

const isAcceptedLogoFile = (file: File): boolean => isAcceptedFile(file, ACCEPTED_LOGO_TYPES, ACCEPTED_LOGO_EXTENSIONS)

const isAcceptedBackgroundFile = (file: File): boolean =>
  isAcceptedFile(file, ACCEPTED_BACKGROUND_TYPES, ACCEPTED_BACKGROUND_EXTENSIONS)

type BrandingImageSectionProps = {
  imageKey: BrandingImageKey
  labelKey: string
  image?: BrandingImageDescriptor
  localObjectUrl?: string | null
  inputRef: RefObject<HTMLInputElement>
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove?: (() => void) | null
  readOnly?: boolean
  surveyId: number | string | null
  uploading?: boolean
  fileInputAccept: string
  previewVariant?: 'logo' | 'background'
}

const BrandingImageSection = (props: BrandingImageSectionProps) => {
  const {
    labelKey,
    image,
    localObjectUrl,
    inputRef,
    onFileChange,
    onRemove,
    readOnly,
    surveyId,
    uploading,
    fileInputAccept,
    previewVariant = 'logo',
  } = props

  const i18n = useI18n()
  const imageSrc = useBrandingLogoSrc({ surveyId, logo: image, localObjectUrl })
  const hasImage = Boolean(imageSrc || image?.[brandingKeys.fileUuid])
  const showLogoFormatHint = previewVariant === 'logo'

  return (
    <fieldset
      className={`survey-info-branding-form__image-section survey-info-branding-form__image-section--${previewVariant}`}
    >
      <legend>{i18n.t(labelKey)}</legend>
      {!readOnly && !hasImage && (
        <>
          {showLogoFormatHint && (
            <p className="survey-info-branding-form__file-hint">
              {i18n.t('homeView:surveyInfo.branding.logoFileFormatHint', { maxMb: LOGO_MAX_SIZE_MB })}
            </p>
          )}
          <div className="survey-info-branding-form__upload-actions">
            <input
              ref={inputRef}
              accept={fileInputAccept}
              className="survey-info-branding-form__file-input"
              onChange={onFileChange}
              type="file"
            />
            <div className="survey-info-branding-form__upload">
              <Button
                disabled={uploading}
                label="homeView:surveyInfo.branding.uploadLogo"
                onClick={() => inputRef.current?.click()}
                size="small"
              />
            </div>
          </div>
        </>
      )}
      {imageSrc && (
        <div className="survey-info-branding-form__image-preview-row">
          <div
            className={`survey-info-branding-form__image-preview survey-info-branding-form__image-preview--${previewVariant}`}
          >
            <img alt="" src={imageSrc} />
          </div>
          {!readOnly && onRemove && <ButtonIconDelete onClick={onRemove} />}
        </div>
      )}
    </fieldset>
  )
}

type BrandingPreviewLogoProps = {
  surveyId: number | string | null
  logo?: BrandingImageDescriptor
  localObjectUrl?: string | null
}

const BrandingPreviewLogo = (props: BrandingPreviewLogoProps) => {
  const { surveyId, logo, localObjectUrl } = props
  const src = useBrandingLogoSrc({ surveyId, logo, localObjectUrl })

  if (!src) return null

  return <img alt="" className="survey-info-branding-form__preview-logo" src={src} />
}

type SurveyInfoBrandingFormProps = {
  branding?: SurveyBrandingData
  setBranding: (branding: SurveyBrandingData) => void
  readOnly?: boolean
  labels?: Record<string, string>
  descriptions?: Record<string, string>
  name?: string
}

export const SurveyInfoBrandingForm = (props: SurveyInfoBrandingFormProps) => {
  const { branding = {}, setBranding, readOnly, labels, descriptions, name } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const confirm = useConfirmAsync()

  const previewSurveyInfo = useMemo(
    () => ({
      props: {
        labels,
        descriptions,
        name,
      },
    }),
    [descriptions, labels, name]
  )
  const previewTitle = Survey.getLabel(previewSurveyInfo, lang)
  const previewDescription = Survey.getDescription(lang, '')(previewSurveyInfo)

  const surveyLogo1InputRef = useRef<HTMLInputElement>(null)
  const surveyLogo2InputRef = useRef<HTMLInputElement>(null)
  const surveyLogo3InputRef = useRef<HTMLInputElement>(null)
  const landingBackgroundInputRef = useRef<HTMLInputElement>(null)
  const logoInputRefByKey = useMemo(
    (): Record<SurveyLogoKey, RefObject<HTMLInputElement>> => ({
      [brandingKeys.surveyLogo1]: surveyLogo1InputRef,
      [brandingKeys.surveyLogo2]: surveyLogo2InputRef,
      [brandingKeys.surveyLogo3]: surveyLogo3InputRef,
    }),
    []
  )
  const [uploadingImageKey, setUploadingImageKey] = useState<BrandingImageKey | null>(null)
  const [localObjectUrls, setLocalObjectUrls] = useState<Partial<Record<BrandingImageKey, string>>>({})

  const {
    [brandingKeys.primaryColor]: primaryColor = '',
    [brandingKeys.landingBackground]: landingBackground = {},
    [brandingKeys.titleFontSize]: titleFontSize = fontSizePreset.default,
    [brandingKeys.descriptionFontSize]: descriptionFontSize = fontSizePreset.default,
  } = branding

  const landingBackgroundSrc = useBrandingLogoSrc({
    surveyId,
    logo: landingBackground,
    localObjectUrl: localObjectUrls[brandingKeys.landingBackground] ?? null,
  })

  const previewColor = resolvePreviewColor(primaryColor)
  const previewButtonColor = previewColor ?? DEFAULT_PREVIEW_BUTTON_COLOR
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

  const setLocalObjectUrl = useCallback((imageKey: BrandingImageKey, file: File) => {
    setLocalObjectUrls((prev) => {
      if (prev[imageKey]) URL.revokeObjectURL(prev[imageKey])
      return { ...prev, [imageKey]: URL.createObjectURL(file) }
    })
  }, [])

  const clearLocalObjectUrl = useCallback((imageKey: BrandingImageKey) => {
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

  const fontSizePresetOptions = useMemo(() => SurveyBranding.fontSizePresetValues, [])

  const onPrimaryColorChange = useCallback(
    (value: string) => {
      const next: SurveyBrandingData = { ...branding }
      if (!value?.trim()) {
        delete next[brandingKeys.primaryColor]
      } else {
        next[brandingKeys.primaryColor] = value
      }
      setBranding(next)
    },
    [branding, setBranding]
  )

  const onFontSizePresetChange = useCallback(
    (fieldKey: typeof brandingKeys.titleFontSize | typeof brandingKeys.descriptionFontSize, value: FontSizePreset) => {
      const next: SurveyBrandingData = { ...branding }
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
    (imageKey: BrandingImageKey) => async () => {
      if (!(await confirm({ key: 'homeView:surveyInfo.surveyDocLayout.confirmDelete' }))) return
      clearLocalObjectUrl(imageKey)
      const next: SurveyBrandingData = { ...branding }
      delete next[imageKey]
      setBranding(next)
    },
    [branding, clearLocalObjectUrl, confirm, setBranding]
  )

  const onImageFileSelected = useCallback(
    async ({
      imageKey,
      fileType,
      file,
      validateFile,
    }: {
      imageKey: BrandingImageKey
      fileType: string
      file: File | undefined
      validateFile: (file: File) => FileValidationError | null
    }) => {
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
          [imageKey]: SurveyBranding.newBrandingImageDescriptor({
            fileUuid: SurveyFile.getUuid(surveyFile),
            size: file.size,
            name: file.name,
          }),
        })
      } catch (error) {
        clearLocalObjectUrl(imageKey)
        dispatch(
          NotificationActions.notifyError({
            key: 'appErrors:generic',
            params: { text: String((error as Error)?.message || error) },
          })
        )
      } finally {
        setUploadingImageKey(null)
      }
    },
    [branding, clearLocalObjectUrl, dispatch, setBranding, setLocalObjectUrl, surveyId]
  )

  const validateLogoFile = useCallback((file: File): FileValidationError | null => {
    if (!isAcceptedLogoFile(file)) {
      return {
        key: 'dropzone.error.invalidFileExtension',
        params: { extension: FileUtils.getExtension(file) },
      }
    }
    if (file.size > SurveyBranding.BRANDING_IMAGE_MAX_FILE_SIZE_BYTES) {
      return {
        key: 'homeView:surveyInfo.branding.logoFileTooLarge',
        params: { maxMb: LOGO_MAX_SIZE_MB },
      }
    }
    return null
  }, [])

  const validateBackgroundFile = useCallback((file: File): FileValidationError | null => {
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

  const createLogoFileChangeHandler = useCallback(
    (imageKey: SurveyLogoKey, fileType: string) => (event: ChangeEvent<HTMLInputElement>) => {
      onImageFileSelected({
        imageKey,
        fileType,
        file: event.target.files?.[0],
        validateFile: validateLogoFile,
      })
      event.target.value = ''
    },
    [onImageFileSelected, validateLogoFile]
  )

  const onLandingBackgroundFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
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
      <div className="survey-info-branding-form__settings-row">
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
            className="survey-info-branding-form__settings-control"
            disabled={readOnly}
            items={[...fontSizePresetOptions]}
            itemLabel={(preset) => i18n.t(`homeView:surveyInfo.branding.fontSizePreset.${preset}`)}
            itemValue={A.identity}
            onChange={(value) => onFontSizePresetChange(brandingKeys.titleFontSize, value as FontSizePreset)}
            readOnly={readOnly}
            selection={titleFontSize}
          />
        </FormItem>

        <FormItem label="homeView:surveyInfo.branding.descriptionFontSize">
          <Dropdown
            className="survey-info-branding-form__settings-control"
            disabled={readOnly}
            items={[...fontSizePresetOptions]}
            itemLabel={(preset) => i18n.t(`homeView:surveyInfo.branding.fontSizePreset.${preset}`)}
            itemValue={A.identity}
            onChange={(value) => onFontSizePresetChange(brandingKeys.descriptionFontSize, value as FontSizePreset)}
            readOnly={readOnly}
            selection={descriptionFontSize}
          />
        </FormItem>
      </div>

      <div className="survey-info-branding-form__logos">
        {LOGO_SLOTS.map(({ imageKey, labelKey, fileType }) => {
          const logo = branding[imageKey] || {}
          return (
            <BrandingImageSection
              key={imageKey}
              imageKey={imageKey}
              labelKey={labelKey}
              image={logo}
              localObjectUrl={localObjectUrls[imageKey] ?? null}
              inputRef={logoInputRefByKey[imageKey]}
              onFileChange={createLogoFileChangeHandler(imageKey, fileType)}
              onRemove={readOnly ? null : onImageRemove(imageKey)}
              readOnly={readOnly}
              surveyId={surveyId}
              uploading={uploadingImageKey === imageKey}
              fileInputAccept={LOGO_FILE_INPUT_ACCEPT}
            />
          )
        })}
      </div>

      <BrandingImageSection
        imageKey={brandingKeys.landingBackground}
        labelKey="homeView:surveyInfo.branding.landingBackground"
        image={landingBackground}
        localObjectUrl={localObjectUrls[brandingKeys.landingBackground] ?? null}
        inputRef={landingBackgroundInputRef}
        onFileChange={onLandingBackgroundFileChange}
        onRemove={readOnly ? null : onImageRemove(brandingKeys.landingBackground)}
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
            <div className="survey-info-branding-form__preview-logos">
              {LOGO_SLOTS.map(({ imageKey }) => (
                <BrandingPreviewLogo
                  key={imageKey}
                  localObjectUrl={localObjectUrls[imageKey] ?? null}
                  logo={branding[imageKey] || {}}
                  surveyId={surveyId}
                />
              ))}
            </div>
            <p className="survey-info-branding-form__preview-title" style={previewTitleStyle}>
              {previewTitle}
            </p>
            {previewDescription ? (
              <p className="survey-info-branding-form__preview-description" style={previewDescriptionStyle}>
                {previewDescription}
              </p>
            ) : null}
            <Button
              color="primary"
              label="common:appModules.records"
              sx={{
                backgroundColor: previewButtonColor,
                '&:hover': { backgroundColor: previewButtonColor },
              }}
            />
          </div>
        </div>
      </fieldset>
    </div>
  )
}
