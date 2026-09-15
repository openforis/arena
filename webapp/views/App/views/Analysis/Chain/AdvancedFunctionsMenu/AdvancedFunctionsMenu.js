import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import * as Chain from '@common/analysis/chain'
import * as SurveyFile from '@core/survey/surveyFile'

import * as API from '@webapp/service/api'
import { ChainActions, useChain, useChainEditLocked } from '@webapp/store/ui/chain'
import { useSurveyCycleKey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'
import { NotificationActions } from '@webapp/store/ui'
import { useConfirmAsync } from '@webapp/components/hooks'
import { Button, ButtonDelete, ButtonDownload, ButtonMenu } from '@webapp/components'

const isZipFile = (file) => file.name?.toLowerCase().endsWith('.zip')

const AdvancedFunctionsMenu = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const surveyId = useSurveyId()
  const chain = useChain()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const chainEditLocked = useChainEditLocked()
  const canEditChain = useAuthCanUseAnalysis()
  const confirmAsync = useConfirmAsync()

  const chainUuid = Chain.getUuid(chain)

  const [mauFile, setMauFile] = useState(null)
  const [uploadingMauFile, setUploadingMauFile] = useState(false)
  const [deletingMauFile, setDeletingMauFile] = useState(false)

  const mauFileInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const fetchMauFile = async () => {
      const file = await API.fetchChainMauFileSummary({ surveyId, chainUuid })
      if (!cancelled) setMauFile(file)
    }
    fetchMauFile()
    return () => {
      cancelled = true
    }
  }, [surveyId, chainUuid])

  const deleteChain = useCallback(
    () => dispatch(ChainActions.deleteChain({ chain, navigate })),
    [chain, dispatch, navigate]
  )

  const onUploadButtonClick = useCallback(() => {
    mauFileInputRef.current.value = ''
    mauFileInputRef.current.click()
  }, [])

  const onMauFileSelected = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!isZipFile(file)) {
        dispatch(NotificationActions.notifyWarning({ key: 'chainView.mauFile.invalidFileExtension' }))
        return
      }

      if (mauFile) {
        const confirmed = await confirmAsync({ key: 'chainView.mauFile.confirmReplace' })
        if (!confirmed) return
      }

      setUploadingMauFile(true)
      try {
        const uploadedFile = await API.uploadChainMauFile({ surveyId, chainUuid, file })
        setMauFile(uploadedFile)
        dispatch(NotificationActions.notifyInfo({ key: 'chainView.mauFile.uploadComplete' }))
      } catch (error) {
        dispatch(
          NotificationActions.notifyError({
            key: 'appErrors:generic',
            params: { text: String(error?.message || error) },
          })
        )
      } finally {
        setUploadingMauFile(false)
      }
    },
    [chainUuid, confirmAsync, dispatch, mauFile, surveyId]
  )

  const onDeleteMauFileClick = useCallback(async () => {
    const confirmed = await confirmAsync({ key: 'chainView.mauFile.confirmDelete' })
    if (!confirmed) return

    setDeletingMauFile(true)
    try {
      await API.deleteChainMauFile({ surveyId, chainUuid })
      setMauFile(null)
      dispatch(NotificationActions.notifyInfo({ key: 'chainView.mauFile.deleteComplete' }))
    } catch (error) {
      dispatch(
        NotificationActions.notifyError({
          key: 'appErrors:generic',
          params: { text: String(error?.message || error) },
        })
      )
    } finally {
      setDeletingMauFile(false)
    }
  }, [chainUuid, confirmAsync, dispatch, surveyId])

  const canEditChainNow = canEditChain && !chainEditLocked

  const items = useMemo(() => {
    const menuItems = [
      {
        key: 'chain-summary-download',
        content: (
          <ButtonDownload
            className="chain-summary-download-btn"
            fileName="chain_summary.json"
            href={API.getChainSummaryExportUrl({ surveyId, chainUuid })}
            label="chainView.downloadSummaryJSON"
            requestParams={{ cycle, lang }}
            variant="text"
          />
        ),
      },
    ]
    if (canEditChainNow) {
      menuItems.push({
        key: 'chain-mau-upload',
        content: (
          <Button
            disabled={uploadingMauFile}
            iconClassName="icon-upload2 icon-12px icon-left"
            label="chainView.mauFile.upload"
            onClick={onUploadButtonClick}
            variant="text"
          />
        ),
      })
    }
    if (mauFile) {
      menuItems.push({
        key: 'chain-mau-download',
        content: (
          <ButtonDownload
            fileName={SurveyFile.getName(mauFile)}
            href={API.getChainMauFileDownloadUrl({ surveyId, chainUuid })}
            label="chainView.mauFile.download"
            variant="text"
          />
        ),
      })
    }
    if (mauFile && canEditChainNow) {
      menuItems.push({
        key: 'chain-mau-delete',
        content: (
          <ButtonDelete disabled={deletingMauFile} label="chainView.mauFile.delete" onClick={onDeleteMauFileClick} />
        ),
      })
    }
    if (canEditChainNow) {
      menuItems.push({
        key: 'chain-delete',
        content: <ButtonDelete label="chainView.deleteChain" onClick={deleteChain} />,
      })
    }
    return menuItems
  }, [
    canEditChainNow,
    chainUuid,
    cycle,
    deleteChain,
    deletingMauFile,
    lang,
    mauFile,
    onDeleteMauFileClick,
    onUploadButtonClick,
    surveyId,
    uploadingMauFile,
  ])

  return (
    <>
      <input ref={mauFileInputRef} accept=".zip" onChange={onMauFileSelected} style={{ display: 'none' }} type="file" />
      <ButtonMenu
        className="advanced-functions-menu-btn"
        iconClassName="icon-cog icon-14px"
        items={items}
        label="common.advancedFunctions"
        size="small"
      />
    </>
  )
}

export default AdvancedFunctionsMenu
