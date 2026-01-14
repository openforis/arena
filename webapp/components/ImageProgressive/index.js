import './ImageProgressive.scss'

import React, { useCallback, useEffect, useState } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { ApiConstants } from '@webapp/service/api/utils/apiConstants'

const fetchImage = async (url) => {
  // If it's a relative path to a static asset, no auth needed
  if (url.startsWith('/img/')) {
    return { url }
  }
  try {
    const headers = {}
    const authToken = ApiConstants.getAuthToken()
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
    }
    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    return { blobUrl }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching image:', err)
    return null
  }
}

const ImageProgressive = (props) => {
  const { alt, altSrc, className, placeholderSrc, src: srcProp } = props

  const [state, setState] = useState({ loading: true, error: false, mainUrlOrBlobUrl: null, altUrlOrBlobUrl: null })

  const { loading, error, mainUrlOrBlobUrl, altUrlOrBlobUrl } = state

  const src = error && altUrlOrBlobUrl ? altUrlOrBlobUrl : mainUrlOrBlobUrl

  const onLoad = useCallback(() => setState((statePrev) => ({ ...statePrev, loading: false })), [])

  const onError = useCallback(() => setState((statePrev) => ({ ...statePrev, error: true, loading: false })), [])

  useEffect(() => {
    let mounted = true
    let createdBlobUrls = []

    const loadImages = async () => {
      if (!mounted) return

      setState((statePrev) => ({ ...statePrev, loading: true, error: false }))

      // Fetch main image with authorization
      const { url: mainUrl, blobUrl: mainBlobUrl } = (await fetchImage(srcProp)) ?? {}
      if (mainBlobUrl) {
        createdBlobUrls.push(mainBlobUrl)
      }
      const _mainUrlOrBlobUrl = mainUrl ?? mainBlobUrl

      let _altUrlOrBlob = null
      if (altSrc) {
        const { url: alternativeUrl, blobUrl: alternativeBlobUrl } = await fetchImage(altSrc)
        _altUrlOrBlob = alternativeUrl ?? alternativeBlobUrl
      }

      if (mounted) {
        setState((statePrev) => ({
          ...statePrev,
          mainUrlOrBlobUrl: _mainUrlOrBlobUrl,
          altUrlOrBlobUrl: _altUrlOrBlob,
          error: !_mainUrlOrBlobUrl,
        }))
      }
    }

    loadImages()

    // Cleanup function to revoke blob URLs
    return () => {
      mounted = false
      for (const url of createdBlobUrls) {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      }
    }
  }, [srcProp, altSrc]) // Re-fetch when src or altSrc changes

  return (
    <>
      {loading && (
        <img
          className={classNames('image-progressive-placeholder loading', className)}
          alt={alt}
          src={placeholderSrc}
        />
      )}

      {src && (
        <img
          alt={alt}
          className={classNames('image-progressive', { loading }, className)}
          onError={onError}
          onLoad={onLoad}
          src={src}
        />
      )}
    </>
  )
}

ImageProgressive.propTypes = {
  alt: PropTypes.string,
  altSrc: PropTypes.string,
  className: PropTypes.string,
  placeholderSrc: PropTypes.string.isRequired,
  src: PropTypes.string.isRequired,
}

export default ImageProgressive
