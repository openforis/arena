import React, { useCallback, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { useOnUpdate } from '@webapp/components/hooks'
import LoadingBar from '@webapp/components/LoadingBar'

export const ImagePreview = ({ path, onLoadComplete = null, file = null }) => {
  const i18n = useI18n()

  const imgRef = useRef(null)
  const [state, setState] = useState({ error: false, loading: false })
  const { error, loading } = state

  useOnUpdate(() => {
    setState({ loading: true, error: false })
  }, [path, file])

  // used the file blob if specified, to avoid downloading the file from the path
  const imgSrc = file ? URL.createObjectURL(file) : path

  const onError = useCallback(() => {
    setState({ loading: false, error: true })
  }, [])

  return (
    <div className="survey-form__node-def-file__preview-image">
      {loading && <LoadingBar />}
      {!error && (
        <img
          ref={imgRef}
          onLoad={() => {
            setState({ loading: false, error: false })
            onLoadComplete?.()
          }}
          src={imgSrc}
          style={{ display: loading ? 'none' : 'block' }}
          onError={onError}
        />
      )}
      {error && (
        <span className="icon error icon-warning" title={i18n.t('surveyForm.nodeDefFile.errorLoadingPreview')} />
      )}
    </div>
  )
}

ImagePreview.propTypes = {
  file: PropTypes.object, // if specified it avoids to fetch the file using the path
  onLoadComplete: PropTypes.func,
  path: PropTypes.string.isRequired,
}
