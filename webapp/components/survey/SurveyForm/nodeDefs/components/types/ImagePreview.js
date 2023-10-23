import React, { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { useOnUpdate } from '@webapp/components/hooks'
import LoadingBar from '@webapp/components/LoadingBar'

export const ImagePreview = ({ path, file = null }) => {
  const i18n = useI18n()

  const imgRef = useRef(null)
  const retriesRef = useRef(0)
  const retryTimeoutRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // reset retry timeout on unmount
  useEffect(() => {
    return () => {
      clearTimeout(retryTimeoutRef.current)
    }
  }, [])

  useOnUpdate(() => {
    setLoading(true)
    setError(false)
    retriesRef.current = 0
    clearTimeout(retryTimeoutRef.current)
  }, [path, file])

  // used the file blob if specified, to avoid downloading the file from the path
  const imgSrc = file ? URL.createObjectURL(file) : path

  const onError = useCallback(() => {
    // try to load again the image after 1 sec, then after 2 seconds, otherwise show a warning icon
    const retries = retriesRef.current
    if (retries <= 2) {
      retryTimeoutRef.current = setTimeout(
        () => {
          retriesRef.current = retries + 1
          imgRef.current.src = path
        },
        1000 * (retries + 1)
      )
    } else {
      setLoading(false)
      setError(true)
    }
  }, [path])

  return (
    <div className="survey-form__node-def-file__preview-image">
      {loading && <LoadingBar />}
      {!error && (
        <img
          ref={imgRef}
          onLoad={() => setLoading(false)}
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
