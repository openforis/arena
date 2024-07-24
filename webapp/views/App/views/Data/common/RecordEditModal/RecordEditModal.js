import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { NodeValueFormatter } from '@core/record/nodeValueFormatter'

import { ResizableModal } from '@webapp/components'
import RecordEditor from '@webapp/components/survey/Record'
import { useRecord } from '@webapp/store/ui/record'
import { useI18n } from '@webapp/store/system'
import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'
import { appModuleUri, noHeaderModules } from '@webapp/app/appModules'
import { WindowUtils } from '@webapp/utils/windowUtils'
import { getViewportDimensions } from '@webapp/utils/domUtils'

const DEFAULT_HEIGHT = 600
const DEFAULT_WIDTH = 1000

const limit = ({ value, min = undefined, max = undefined }) => {
  let res = value
  if (min !== undefined && res < min) {
    res = min
  }
  if (max !== undefined && res > max) {
    res = max
  }
  return res
}

const determineModalInitialState = (initStateProp) => {
  const { height: windowHeight, width: windowWidth } = getViewportDimensions()
  const availableWidth = windowWidth - 100
  const availableHeight = windowHeight - 100
  const initialHeight = limit({ value: initStateProp?.height || DEFAULT_HEIGHT, max: availableHeight })
  const initialWidth = limit({ value: initStateProp?.width || DEFAULT_WIDTH, max: availableWidth })
  const initialLeft = limit({ value: initStateProp?.left, min: 0, max: availableWidth - initialWidth })
  const initialTop = limit({ value: initStateProp?.top, min: 0, max: availableHeight - initialHeight })
  return { initialWidth, initialHeight, initialLeft, initialTop }
}

const RecordEditModalTitle = () => {
  const i18n = useI18n()
  const survey = useSurvey()
  const record = useRecord()
  const lang = useSurveyPreferredLang()

  if (!record) return null

  const keyValues = NodeValueFormatter.getFormattedRecordKeys({ survey, record, lang })

  const title = i18n.t('recordView.recordEditModalTitle', { keyValues })

  return <span>{title}</span>
}

export const RecordEditModal = (props) => {
  const {
    detachable = true,
    initialState: initialStateProp,
    onClose,
    onRequestClose,
    parentNodeUuid,
    recordUuid,
  } = props

  const onDetach = useCallback(() => {
    const recordEditUrl = `${window.location.origin}${appModuleUri(noHeaderModules.record)}${recordUuid}`
    WindowUtils.openPopup(recordEditUrl, 'arena-record-edit-modal')
    onRequestClose?.()
  }, [onRequestClose, recordUuid])

  const onModalClose = useCallback(
    ({ modalState }) => {
      onClose?.({ modalState })
    },
    [onClose]
  )

  const { initialWidth, initialHeight, initialLeft, initialTop } = determineModalInitialState(initialStateProp)

  return (
    <ResizableModal
      className="record-edit-modal"
      header={<RecordEditModalTitle />}
      initWidth={initialWidth}
      initHeight={initialHeight}
      left={initialLeft}
      onClose={onModalClose}
      onDetach={detachable ? onDetach : undefined}
      onRequestClose={onRequestClose}
      top={initialTop}
    >
      <RecordEditor recordUuid={recordUuid} pageNodeUuid={parentNodeUuid} noHeader />
    </ResizableModal>
  )
}

RecordEditModal.propTypes = {
  detachable: PropTypes.bool,
  initialState: PropTypes.object,
  onClose: PropTypes.func,
  onRequestClose: PropTypes.func,
  parentNodeUuid: PropTypes.string,
  recordUuid: PropTypes.string.isRequired,
}
