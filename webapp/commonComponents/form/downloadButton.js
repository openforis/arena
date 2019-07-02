import React from 'react'

const DownloadButton = ({href, label = 'Download', showLabel = true, disabled = false, title = null}) => (
  <a className="btn btn-s"
     aria-disabled={disabled}
     target="_blank"
     href={href}
     title={title}>
    <span className={`icon icon-download2 icon-14px${showLabel && label ? ' icon-left' : ''}`}/>
    {showLabel && label}
  </a>
)

export default DownloadButton
