import './ImageProgressive.scss'

import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

const ImageProgressive = (props) => {
  const { alt, altSrc, className, placeholderSrc, src: srcProp } = props

  const [state, setState] = useState({ loading: true, error: false })

  const { loading, error } = state

  const src = error && altSrc ? altSrc : srcProp

  const onLoad = useCallback(() => setState((statePrev) => ({ ...statePrev, loading: false })), [])

  const onError = useCallback(() => setState((statePrev) => ({ ...statePrev, error: true, loading: false })), [])

  return (
    <>
      {loading && (
        <img
          className={classNames('image-progressive-placeholder loading', className)}
          alt={alt}
          src={placeholderSrc}
        />
      )}

      <img
        alt={alt}
        className={classNames('image-progressive', { loading }, className)}
        onError={onError}
        onLoad={onLoad}
        src={src}
      />
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
