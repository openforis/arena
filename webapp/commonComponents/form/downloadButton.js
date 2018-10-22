import React from 'react'

const DownloadButton = ({href, label = 'Download', disabled}) => (
  <a className="btn btn-of btn-download"
     aria-disabled={disabled}
     target="_blank"
     href={href}>
    <span className="icon icon-download2 icon-16px icon-left"/>
    {label}
  </a>
)

export default DownloadButton