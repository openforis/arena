import { useState } from 'react'
import classNames from 'classnames'

import * as ProcessUtils from '@core/processUtils'

import Markdown from '@webapp/components/markdown'
import { useI18nT } from '@webapp/store/system'

const defaultTags = ['forestInventories', 'questionnaires', 'multiCycle', 'statisticalAnalysis']
const accessRequestSteps = ['sendRequest', 'review', 'invitation', 'startWorking']

type Props = {
  accessRequest?: boolean
}

const PitchTags = () => {
  const t = useI18nT()
  return (
    <ul className="guest__pitch-tags">
      {defaultTags.map((tag) => (
        <li key={tag}>{t(`guest:pitch.tags.${tag}`)}</li>
      ))}
    </ul>
  )
}

// what happens after an access request is sent
const getStepDescriptionKey = (step: string, senderEmail: string | undefined): string => {
  const descriptionKey = step === 'invitation' && !senderEmail ? 'descriptionWithoutSender' : 'description'
  return `guest:accessRequestView.steps.${step}.${descriptionKey}`
}

const AccessRequestSteps = () => {
  const t = useI18nT()
  // collapsed only on small screens (see Guest.scss), to keep the form visible
  const [expanded, setExpanded] = useState(false)
  // emails are sent from this address: users should look for it (also in the spam folder)
  const senderEmail = ProcessUtils.ENV.emailFromResolved
  return (
    <>
      <button
        type="button"
        className="guest__pitch-steps-toggle"
        aria-expanded={expanded}
        aria-controls="guest-pitch-steps"
        onClick={() => setExpanded(!expanded)}
      >
        {t('guest:accessRequestView.whatHappensNext')}
        <span className={classNames('icon icon-12px', expanded ? 'icon-arrow-up2' : 'icon-arrow-down2')} />
      </button>
      <ol id="guest-pitch-steps" className={classNames('guest__pitch-steps', { collapsed: !expanded })}>
        {accessRequestSteps.map((step) => (
          <li key={step}>
            <strong>{t(`guest:accessRequestView.steps.${step}.title`)}</strong>
            <Markdown
              className="guest__pitch-step-description"
              container="span"
              source={t(getStepDescriptionKey(step, senderEmail), { senderEmail })}
            />
          </li>
        ))}
      </ol>
    </>
  )
}

/**
 * Short presentation of Arena shown next to the guest forms.
 *
 * @param {Props} props - The props.
 * @param {boolean} [props.accessRequest] - True to show the presentation for the access request view.
 * @returns {React.ReactElement} The pitch element.
 */
export const GuestPitch = ({ accessRequest = false }: Props) => {
  const t = useI18nT()
  const prefix = accessRequest ? 'guest:pitch.accessRequest' : 'guest:pitch.default'
  return (
    <section className={classNames('guest__pitch', { 'guest__pitch--access-request': accessRequest })}>
      <h1>{t(`${prefix}.title`)}</h1>
      {accessRequest ? (
        <AccessRequestSteps />
      ) : (
        <>
          <p>{t('guest:pitch.default.description')}</p>
          <PitchTags />
        </>
      )}
    </section>
  )
}
