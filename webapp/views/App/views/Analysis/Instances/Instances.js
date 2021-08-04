import './Instances.scss'

import React, { useEffect, useState } from 'react'
import axios from 'axios'

import * as User from '@core/user/user'
import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import ButtonRStudio from '@webapp/components/ButtonRStudio'
import { useUser } from '@webapp/store/user'

const Instances = () => {
  const user = useUser()
  const i18n = useI18n()

  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState({})
  const [url, setUrl] = useState('')

  const getRStudioInstances = async () => {
    try {
      const { data } = await axios.get('/api/rstudio')
      const { instance, rStudioProxyUrl } = data
      setInstance(instance)
      setUrl(`${rStudioProxyUrl}${instance.instanceId}_${User.getUuid(user)}`)
    } catch (err) {
      return false
    } finally {
      setLoading(false)
    }
  }

  const requestRStudioInstances = async () => {
    try {
      setLoading(true)
      const { data = {} } = await axios.post('/api/rstudio')
      const { instanceId = false, rStudioProxyUrl = false } = data
      setInstance({ instanceId })
      setUrl(`${rStudioProxyUrl}${instanceId}_${User.getUuid(user)}`)
    } catch (err) {
      return false
    } finally {
      setLoading(false)
    }
  }

  const closeRStudioInstance = async () => {
    try {
      setLoading(true)
      const { instanceId } = instance
      await axios.delete('/api/rstudio', { params: { instanceId } })
      setInstance(null)
      setUrl(false) 
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getRStudioInstances()
  }, [])

  if (loading) return <p>loading...</p>
  return (
    <div className="instances-container">
      <p>{i18n.t('instancesView.title')}</p>
      {!A.isEmpty(instance) ? (
        <div className="instance-row">
          <a href={url} target="_blank">
            <p>
              {instance.Purpose || 'RStudio'} - {instance.instanceId}{' '}
            </p>
          </a>
          <button onClick={closeRStudioInstance}>{i18n.t('instancesView.terminate')}</button>
        </div>
      ) : (
        <ButtonRStudio onClick={requestRStudioInstances} />
      )}
    </div>
  )
}

export default Instances
