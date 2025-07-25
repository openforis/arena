import './nodeDefFile.scss'

import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { PointFactory, Points } from '@openforis/arena-core'

import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import UploadButton from '@webapp/components/form/uploadButton'
import { ButtonDownload } from '@webapp/components/buttons'
import { TooltipNew } from '@webapp/components/TooltipNew'

import { NotificationActions } from '@webapp/store/ui'
import * as API from '@webapp/service/api'

import NodeDeleteButton from '../nodeDeleteButton'
import { ImagePreview } from './ImagePreview'
import { MapTriggerButton } from '../mapTriggerButton'

const FileInput = (props) => {
  const { surveyInfo, nodeDef, node, readOnly, edit, canEditRecord, updateNode, removeNode, insideTable, lang } = props

  const surveyId = surveyInfo?.id

  const nodeDefLabel = NodeDef.getLabel(nodeDef, lang)

  const dispatch = useDispatch()

  const [fileUploaded, setFileUploaded] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const [imageFileMarkerPoint, setImageFileMarkerPoint] = useState(null)

  const isImage = NodeDef.getFileType(nodeDef) === NodeDef.fileTypeValues.image
  const originalFileName = Node.getFileName(node)
  const fileName = Node.getFileNameCalculated(node) ?? originalFileName
  const fileReady = !edit && originalFileName
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
    <ButtonDownload href={fileUrl} label={fileName} title={isImage ? undefined : fileName} className="btn-s ellipsis" />
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
          {
            // when file is an image, show the image preview in a tooltip
            isImage && (
              <>
                <TooltipNew
                  className="image-preview-tooltip"
                  renderTitle={() => <ImagePreview path={fileUrl} file={fileUploaded} />}
                >
                  {downloadButton}
                </TooltipNew>
                {NodeDef.isGeotagInformationShown(nodeDef) && (
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
              </>
            )
          }
          {!isImage && downloadButton}

          {!updateDisabled && (
            <NodeDeleteButton disabled={updateDisabled} nodeDef={nodeDef} node={node} removeNode={handleNodeDelete} />
          )}
        </>
      )}
    </div>
  )
}

FileInput.propTypes = {
  surveyInfo: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
  node: PropTypes.object,
  readOnly: PropTypes.bool,
  edit: PropTypes.bool,
  canEditRecord: PropTypes.bool,
  updateNode: PropTypes.func.isRequired,
  removeNode: PropTypes.func.isRequired,
  insideTable: PropTypes.bool,
  lang: PropTypes.string,
}

const MultipleFileInput = (props) => {
  const { nodes } = props

  return (
    <div>
      {nodes.map((n, i) => (
        <FileInput key={i} {...props} node={n} />
      ))}
    </div>
  )
}

MultipleFileInput.propTypes = {
  nodes: PropTypes.array.isRequired,
}

const NodeDefFile = (props) => (props.edit ? <FileInput {...props} /> : <MultipleFileInput {...props} />)

NodeDefFile.propTypes = {
  edit: PropTypes.bool,
}

export default NodeDefFile
