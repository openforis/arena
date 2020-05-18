import React from 'react'

const RStudioView = () => (
  <iframe title="RStudio" src={`${window.location.origin}/rstudio/`} style={{ height: '100%', width: '100%' }} />
)

export default RStudioView
