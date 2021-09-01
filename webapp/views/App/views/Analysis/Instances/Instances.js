import './Instances.scss'

import React, { useEffect, useState } from 'react'

import * as User from '@core/user/user'
import * as A from '@core/arena'

import * as API from '@webapp/service/api'

import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

const Instances = () => {
  const user = useUser()
  const i18n = useI18n()

  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState({})
  const [url, setUrl] = useState('')

  const getRStudioInstances = async () => {
    try {
      const { instance, getRStudioUrl } = await API.getCurrentInstance()
      setInstance(instance)
      setUrl(getRStudioUrl({ userUuid: User.getUuid(user) }))
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
      await API.terminateInstance({ instanceId })
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
      {!A.isEmpty(instance) && (
        <div className="instance-row">
          <a href={url} target="_blank">
            <p>
              {instance.Purpose || 'RStudio'} - {instance.instanceId}{' '}
            </p>
          </a>
          <button onClick={closeRStudioInstance}>{i18n.t('instancesView.terminate')}</button>
        </div>
      )}

      {A.isEmpty(instance) && (
        <div className="instance-row">
          <p>{i18n.t('instancesView.empty')}</p>
        </div>
      )}
    </div>
  )
}

export default Instances
