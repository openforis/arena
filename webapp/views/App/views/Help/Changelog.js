import React, { useEffect, useState } from 'react'

import Markdown from '@webapp/components/markdown'
import * as API from '@webapp/service/api'

export const Changelog = () => {
  const [content, setContent] = useState('')

  useEffect(() => {
    API.fetchChangelog().then(setContent)
  }, [])

  return <Markdown source={content} />
}
