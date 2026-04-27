import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import { heicTo } from 'heic-to'

import { useI18n } from '@webapp/store/system'
import LoadingBar from '@webapp/components/LoadingBar'

const initialState = { error: false, loading: true }

const fetchFile = async ({ file, path }) => {
  if (file) {
    // used the file blob if specified, to avoid downloading the file from the path
    return { file, contentType: file.type }
  }
  if (path) {
    const { data, headers } = await axios.get(path, { responseType: 'blob' })
    const contentType = headers['content-type']
    return { file: data, contentType }
  }
  return null
}

// Ensures that HEIC images are converted to JPEG before being displayed, as HEIC is not widely supported by browsers.
const ensureJpegConversion = async ({ blob, contentType }) => {
  if (contentType === 'image/heif') {
    return heicTo({
      blob,
      type: 'image/jpeg',
    })
  }
  return blob
}

export const ImagePreview = ({ path, onLoadComplete = null, file = null }) => {
  const i18n = useI18n()

  const imgRef = useRef(null)
  // used to store the image src to be able to revoke it on unmount
  const imgSrcRef = useRef(null)
  const [state, setState] = useState(initialState)
  const isMountedRef = useRef(true)
  const { error, loading } = state

  const onImageLoad = useCallback(async ({ file: blob, contentType }) => {
    if (!blob || !isMountedRef.current) {
      return
    }
    const convertedBlob = await ensureJpegConversion({ blob, contentType })
    if (!isMountedRef.current) {
      const imgUrl = URL.createObjectURL(convertedBlob)
      imgSrcRef.current = imgUrl
      imgRef.current.src = imgUrl
    }
  }, [])

  useEffect(() => {
    fetchFile({ file, path })
      .then(({ file, contentType }) => {
        onImageLoad({ file, contentType }).catch(() => {
          if (!isMountedRef.current) {
            setState({ loading: false, error: true })
          }
        })
      })
      .catch(() => {
        if (!isMountedRef.current) {
          setState({ loading: false, error: true })
        }
      })
    return () => {
      isMountedRef.current = false
      // revoke object URL to avoid memory leaks
      const imgSrc = imgSrcRef.current
      if (imgSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc)
      }
    }
  }, [path, file, onImageLoad])

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
