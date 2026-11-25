import './NodeDefFile.scss'

import { useCallback, useState } from 'react'

import { PointFactory, Points, type ArenaRecordNode } from '@openforis/arena-core'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import UploadButton from '@webapp/components/form/UploadButton'
import { ButtonDownload } from '@webapp/components/buttons'
import { TooltipNew } from '@webapp/components/TooltipNew'

import { NotificationActions } from '@webapp/store/ui'
import * as API from '@webapp/service/api'

import NodeDeleteButton from '../NodeDeleteButton'
import { ImagePreview } from './ImagePreview'
import { MapTriggerButton } from '../MapTriggerButton'
import { useAppDispatch } from '@webapp/store'
import type { NodeDefComponentProps } from '../nodeDefComponentProps'

type FileInputProps = NodeDefComponentProps & {
  surveyInfo: Record<string, any>
  node?: ArenaRecordNode
  removeNode: (...args: any[]) => any
  lang?: string
}

const FileInput = (props: FileInputProps) => {
  const { surveyInfo, nodeDef, node, readOnly, edit, canEditRecord, updateNode, removeNode, insideTable, lang } = props

  const surveyId = surveyInfo?.id

  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  const dispatch = useAppDispatch()

  const [fileUploaded, setFileUploaded] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [imageFileMarkerPoint, setImageFileMarkerPoint] = useState(null)

  const fileUuid = Node.getFileUuid(node)
  const isImage = NodeDef.getFileType(nodeDef) === NodeDef.fileTypeValues.image
  const originalFileName = Node.getFileName(node)
  const fileName = Node.getFileNameCalculated(node) || originalFileName
  const fileNameDisplayed = fileName || fileUuid
  const buttonLabel = isImage ? undefined : fileNameDisplayed
  const fileReady = !edit && fileUuid
  const fileUrl = API.getRecordNodeFileUrl({ surveyId, node })

  const updateDisabled = edit || !canEditRecord || readOnly

  const handleFileChange = (file) => {
    const value = {
      [Node.valuePropsFile.fileUuid]: uuidv4(),
      [Node.valuePropsFile.fileName]: file.name,
      [Node.valuePropsFile.fileSize]: file.size,
    }
    updateNode(nodeDef, node, value, file)
    setFileUploaded(file)
  }

  const handleNodeDelete = () => {
    if (NodeDef.isMultiple(nodeDef)) {
      removeNode(nodeDef, node)
    } else {
      // Do not delete single node, delete only its value
      updateNode(nodeDef, node, null)
    }
  }

  const toggleShowMap = useCallback(() => setShowMap(!showMap), [showMap, setShowMap])

  const onShowOnMapClick = useCallback(async () => {
    const info = await API.fetchRecordsNodeFileExifInfo({ surveyId, node })
    const { longitude, latitude } = info ?? {}
    const point = PointFactory.createInstance({ x: longitude, y: latitude })
    if (Points.isValid(point)) {
      setImageFileMarkerPoint(point)
      toggleShowMap()
    } else {
      dispatch(NotificationActions.notifyWarning({ key: 'surveyForm:nodeDefFile.locationInformationNotFound' }))
    }
  }, [surveyId, node, toggleShowMap, dispatch])

  const downloadButton = (
    <ButtonDownload
      fileName={fileName}
      href={fileUrl}
      label={buttonLabel}
      labelIsI18nKey={false}
      showLabel={false}
      title={isImage ? undefined : fileNameDisplayed}
      titleIsI18nKey={false}
      className="btn-s survey-form__node-def-file__download-btn"
    >
      <span className="survey-form__node-def-file__download-btn-label">{fileNameDisplayed}</span>
    </ButtonDownload>
  )

  const downloadButtonWrapper = (button) => (
    <div className="survey-form__node-def-file__download-btn-wrapper">{button}</div>
  )

  return (
    <div className="survey-form__node-def-file">
      <UploadButton
        className="btn-s"
        disabled={updateDisabled}
        showLabel={false}
        onChange={(files) => handleFileChange(files[0])}
        maxSize={NodeDef.getMaxFileSize(nodeDef)}
      />

      {fileReady && (
        <>
          {isImage &&
            // when file is an image, show the image preview in a tooltip
            downloadButtonWrapper(
              <TooltipNew
                className="image-preview-tooltip"
                renderTitle={() => <ImagePreview path={fileUrl} file={fileUploaded} />}
              >
                {downloadButton}
              </TooltipNew>
            )}
          {!isImage && downloadButtonWrapper(downloadButton)}

          {isImage && NodeDef.isGeotagInformationShown(nodeDef) && (
            <MapTriggerButton
              disabled={edit}
              insideTable={insideTable}
              showMap={showMap}
              onClick={onShowOnMapClick}
              mapMarkerPoint={imageFileMarkerPoint}
              mapMarkerTitle={fileName}
              onPanelClose={toggleShowMap}
              panelHeader={nodeDefLabel}
              title="surveyForm:nodeDefCoordinate.showOnMap"
            />
          )}

          {!updateDisabled && (
            <NodeDeleteButton disabled={updateDisabled} nodeDef={nodeDef} node={node} removeNode={handleNodeDelete} />
          )}
        </>
      )}
    </div>
  )
}

type MultipleFileInputProps = FileInputProps & {
  nodes?: ArenaRecordNode[]
}

const MultipleFileInput = (props: MultipleFileInputProps) => {
  const { nodes = [] } = props

  return (
    <div>
      {nodes.map((n) => (
        <FileInput key={Node.getUuid(n)} {...props} node={n} />
      ))}
    </div>
  )
}

type NodeDefFileProps = FileInputProps & {
  nodes?: ArenaRecordNode[]
}

const NodeDefFile = (props: NodeDefFileProps) =>
  props.edit ? <FileInput {...props} /> : <MultipleFileInput {...props} />

export default NodeDefFile
