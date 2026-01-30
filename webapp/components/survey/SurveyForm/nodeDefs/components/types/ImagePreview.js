import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

import { useI18n } from '@webapp/store/system'
import LoadingBar from '@webapp/components/LoadingBar'

const initialState = { error: false, loading: true }

const determineImageSrc = async ({ file, path }) => {
  if (file) {
    // used the file blob if specified, to avoid downloading the file from the path
    return file
  }
  if (path) {
    const { data } = await axios.get(path, { responseType: 'blob' })
    return data
  }
  return null
}

export const ImagePreview = ({ path, onLoadComplete = null, file = null }) => {
  const i18n = useI18n()

  const imgRef = useRef(null)
  // used to store the image src to be able to revoke it on unmount
  const imgSrcRef = useRef(null)
  const [state, setState] = useState(initialState)
  const { error, loading } = state

  useEffect(() => {
    let isCanceled = false
    determineImageSrc({ file, path })
      .then((blob) => {
        if (blob && !isCanceled) {
          const imgUrl = URL.createObjectURL(blob)
          imgSrcRef.current = imgUrl
          imgRef.current.src = imgUrl
        }
      })
      .catch(() => {
        if (!isCanceled) {
          setState({ loading: false, error: true })
        }
      })
    return () => {
      isCanceled = true
      // revoke object URL to avoid memory leaks
      const imgSrc = imgSrcRef.current
      if (imgSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc)
      }
    }
  }, [path, file])

  const onLoad = useCallback(() => {
    setState({ loading: false, error: false })
    onLoadComplete?.()
  }, [onLoadComplete])

  const onError = useCallback(() => {
    setState({ loading: false, error: true })
  }, [])

  return (
    <div className="survey-form__node-def-file__preview-image">
      {loading && <LoadingBar />}
      {!error && (
        <img ref={imgRef} alt="" onLoad={onLoad} style={{ display: loading ? 'none' : 'block' }} onError={onError} />
      )}
      {error && (
        <span className="icon error icon-warning" title={i18n.t('surveyForm:nodeDefFile.errorLoadingPreview')} />
      )}
    </div>
  )
}

ImagePreview.propTypes = {
  file: PropTypes.object, // if specified it avoids to fetch the file using the path
  onLoadComplete: PropTypes.func,
  path: PropTypes.string.isRequired,
}
