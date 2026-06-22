import './SurveyDocImagesEditor.scss'

import React, { useCallback, useState } from 'react'

import * as SurveyFile from '@core/survey/surveyFile'
import * as DateUtils from '@core/dateUtils'
import { getDocumentPlace, getExpression } from '@core/survey/surveyDocImage'

import { ButtonAdd, ButtonDownload, ButtonIconDelete, ButtonIconEdit } from '@webapp/components'
import { useConfirmAsync } from '@webapp/components/hooks'
import { DataGrid } from '@webapp/components/DataGrid'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import * as API from '@webapp/service/api'

import SurveyDocImageEditor from './SurveyDocImageEditor'

type Props = {
  surveyDocImages: object[]
  setSurveyDocImages: (images: object[]) => void
  readOnly?: boolean
}

const SurveyDocImagesEditor = (props: Props) => {
  const { surveyDocImages, setSurveyDocImages, readOnly } = props

  const i18n = useI18n()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const confirm = useConfirmAsync()

  const [dialogVisible, setDialogVisible] = useState(false)
  const [editedSurveyDocImage, setEditedSurveyDocImage] = useState<object | null>(null)

  const onAddClick = useCallback(() => {
    setDialogVisible(true)
  }, [])

  const onDialogClose = useCallback(() => {
    setDialogVisible(false)
    setEditedSurveyDocImage(null)
  }, [])

  const onDialogOk = useCallback(
    async ({ file, surveyDocImage }: { file: File | null; surveyDocImage: object }) => {
      setDialogVisible(false)
      setEditedSurveyDocImage(null)

      const surveyDocImagesNext = editedSurveyDocImage
        ? surveyDocImages.map((img) =>
            SurveyFile.getUuid(img) === SurveyFile.getUuid(editedSurveyDocImage) ? surveyDocImage : img
          )
        : [...(surveyDocImages ?? []), surveyDocImage]
      if (!editedSurveyDocImage || file) {
        await API.insertSurveyFile({ surveyId, file, surveyFile: surveyDocImage })
      }
      setSurveyDocImages(surveyDocImagesNext)
    },
    [editedSurveyDocImage, surveyDocImages, setSurveyDocImages, surveyId]
  )

  const onDeleteClick = useCallback(
    ({ surveyDocImage }: { surveyDocImage: object }) =>
      async () => {
        if (await confirm({ key: 'homeView:surveyInfo.surveyDocImages.confirmDelete' })) {
          setSurveyDocImages(
            surveyDocImages.filter((img) => SurveyFile.getUuid(img) !== SurveyFile.getUuid(surveyDocImage))
          )
        }
      },
    [confirm, setSurveyDocImages, surveyDocImages]
  )

  const onRowDoubleClick = useCallback(({ row }: { row: object }) => {
    setEditedSurveyDocImage(row)
    setDialogVisible(true)
  }, [])

  return (
    <>
      <fieldset className="survey-doc-images-editor">
        <legend>{i18n.t('homeView:surveyInfo.surveyDocImages.title')}</legend>
        <div className="container">
          {!readOnly && <ButtonAdd onClick={onAddClick} size="small" />}
          <DataGrid
            autoHeight
            columns={[
              {
                field: 'edit',
                width: 60,
                headerName: '',
                renderCell: ({ row }: { row: object }) => <ButtonIconEdit onClick={() => onRowDoubleClick({ row })} />,
                sortable: false,
              },
              {
                field: 'fileName',
                flex: 0.35,
                headerName: i18n.t('common:files.fileName'),
                renderCell: ({ row }: { row: object }) => <LabelWithTooltip label={SurveyFile.getName(row)} />,
                sortable: false,
              },
              {
                field: 'download',
                width: 60,
                headerName: '',
                renderCell: ({ row: surveyDocImage }: { row: object }) => (
                  <ButtonDownload
                    href={API.getSurveyFileDownloadUrl({ surveyId, fileUuid: SurveyFile.getUuid(surveyDocImage) })}
                    showLabel={false}
                    variant="text"
                  />
                ),
                sortable: false,
              },
              {
                field: 'label',
                flex: 0.3,
                headerName: i18n.t('common.label'),
                renderCell: ({ row }: { row: object }) => <LabelWithTooltip label={SurveyFile.getLabel(lang)(row)} />,
                sortable: false,
              },
              {
                field: 'documentPlace',
                width: 100,
                headerName: i18n.t('homeView:surveyInfo.surveyDocImages.documentPlace'),
                renderCell: ({ row }: { row: object }) => {
                  const place = getDocumentPlace(row)
                  return place ? i18n.t(`homeView:surveyInfo.surveyDocImages.documentPlaceValues.${place}`) : ''
                },
                sortable: false,
              },
              {
                field: 'expression',
                flex: 0.3,
                headerName: i18n.t('homeView:surveyInfo.surveyDocImages.expression'),
                renderCell: ({ row }: { row: object }) => <LabelWithTooltip label={getExpression(row)} />,
                sortable: false,
              },
              {
                field: 'fileSize',
                width: 100,
                headerName: i18n.t('common:files.fileSize'),
                renderCell: ({ row }: { row: object }) => FileUtils.toHumanReadableFileSize(SurveyFile.getSize(row)),
                sortable: false,
              },
              {
                field: 'dateCreated',
                width: 180,
                headerName: i18n.t('common.dateCreated'),
                renderCell: ({ row }: { row: object }) =>
                  DateUtils.formatDateTimeDisplay(SurveyFile.getDateCreated(row)),
              },
              {
                field: 'delete',
                width: 60,
                headerName: '',
                renderCell: ({ row: surveyDocImage }: { row: object }) =>
                  !readOnly && <ButtonIconDelete onClick={onDeleteClick({ surveyDocImage })} />,
                sortable: false,
              },
            ]}
            density="compact"
            getRowId={(row: object) => SurveyFile.getUuid(row)}
            hideFooterPagination
            onRowDoubleClick={onRowDoubleClick}
            rows={surveyDocImages ?? []}
          />
        </div>
      </fieldset>

      {dialogVisible && (
        <SurveyDocImageEditor
          editedSurveyDocImage={editedSurveyDocImage}
          onClose={onDialogClose}
          onOk={onDialogOk}
          surveyDocImages={surveyDocImages ?? []}
        />
      )}
    </>
  )
}

export default SurveyDocImagesEditor
