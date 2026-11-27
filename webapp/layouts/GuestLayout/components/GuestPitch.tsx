import { useState } from 'react'
import classNames from 'classnames'

import * as ProcessUtils from '@core/processUtils'
import { AppIcon } from '@webapp/components/AppIcon'
import Markdown from '@webapp/components/Markdown'
import { useI18nT } from '@webapp/store/system'

const defaultTags = ['forestInventories', 'questionnaires', 'multiCycle', 'statisticalAnalysis']
const accessRequestSteps = ['sendRequest', 'review', 'invitation', 'startWorking']
// with self-registration, the account is created right away
const registrationSteps = ['createAccount', 'confirmEmail', 'startWorking']
// steps whose description shows the email sender
const emailSteps = new Set(['invitation', 'confirmEmail'])

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

const getStepsPrefix = () =>
  ProcessUtils.ENV.allowUserSelfRegistration ? 'guest:registrationView.steps' : 'guest:accessRequestView.steps'

// what happens after an access request is sent (or the account is created)
const getStepDescriptionKey = (step: string, senderEmail: string | undefined): string => {
  const descriptionKey = emailSteps.has(step) && !senderEmail ? 'descriptionWithoutSender' : 'description'
  return `${getStepsPrefix()}.${step}.${descriptionKey}`
}

const AccessRequestSteps = () => {
  const t = useI18nT()
  // collapsed only on small screens (see Guest.scss), to keep the form visible
  const [expanded, setExpanded] = useState(false)
  // emails are sent from this address: users should look for it (also in the spam folder)
  const senderEmail = ProcessUtils.ENV.emailFromResolved
  const steps = ProcessUtils.ENV.allowUserSelfRegistration ? registrationSteps : accessRequestSteps
  const stepsPrefix = getStepsPrefix()
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
        <AppIcon name={expanded ? 'arrowUp' : 'arrowDown'} size={14} />
      </button>
      <ol id="guest-pitch-steps" className={classNames('guest__pitch-steps', { collapsed: !expanded })}>
        {steps.map((step) => (
          <li key={step}>
            <strong>{t(`${stepsPrefix}.${step}.title`)}</strong>
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
