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
  // emails are sent from this address: users should look for it (also in the spam folder)
  const senderEmail = ProcessUtils.ENV.emailFromResolved
  return (
    <ol className="guest__pitch-steps">
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
    <section className="guest__pitch">
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
