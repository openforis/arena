import React from 'react'

const DownloadButton = ({href, label = 'Download', showLabel = true, disabled = false}) => (
  <a className="btn btn-of btn-download"
     aria-disabled={disabled}
     target="_blank"
     href={href}>
    <span className={`icon icon-download2 icon-16px${showLabel && label ? ' icon-left' : ''}`}/>
    {showLabel && label}
  </a>
)

export default DownloadButton
