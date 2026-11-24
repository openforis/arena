import './Instances.scss'

import { useEffect, useState } from 'react'
import axios from 'axios'

import * as User from '@core/user/user'
import * as A from '@core/arena'

import { useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useUser } from '@webapp/store/user'

type RStudioInstance = {
  instanceId?: string
  Purpose?: string
}

const Instances = () => {
  const user = useUser()
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const rStudioApiUrl = `/api/survey/${surveyId}/rstudio`

  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState<RStudioInstance | null>(null)
  const [url, setUrl] = useState('')

  const closeRStudioInstance = async () => {
    try {
      setLoading(true)
      const { instanceId } = instance
      await axios.delete(rStudioApiUrl, { params: { instanceId } })
      setInstance(null)
      setUrl('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    axios
      .get(rStudioApiUrl)
      .then(({ data }) => {
        const { instance, rStudioProxyUrl } = data ?? {}
        setInstance(instance ?? null)
        if (instance?.instanceId) {
          setUrl(`${rStudioProxyUrl}${instance.instanceId}_${User.getUuid(user)}`)
        }
      })
      .catch(() => {
        // no RStudio instance available
      })
      .finally(() => setLoading(false))
  }, [rStudioApiUrl, user])

  if (loading) return <p>{i18n.t('common.loading')}</p>
  return (
    <div className="instances-container">
      <p>{i18n.t('instancesView.title')}</p>
      {A.isEmpty(instance?.instanceId) ? (
        <div className="instances-empty">
          <p>{i18n.t('instancesView.noSessionRunning')}</p>
          <p className="instances-empty__hint">{i18n.t('instancesView.noSessionRunningHint')}</p>
        </div>
      ) : (
        <div className="instance-row">
          <a href={url} target="_blank" rel="noreferrer">
            <p>
              {instance.Purpose || 'RStudio'} - {instance.instanceId}{' '}
            </p>
          </a>
          <button onClick={closeRStudioInstance}>{i18n.t('instancesView.terminate')}</button>
        </div>
      )}
    </div>
  )
}

export default Instances
