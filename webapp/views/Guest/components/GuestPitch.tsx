import { useI18nT } from '@webapp/store/system'

const defaultTags = ['forestInventories', 'questionnaires', 'multiCycle', 'statisticalAnalysis']
const accessRequestSteps = ['sendRequest', 'review', 'invitation']

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
const AccessRequestSteps = () => {
  const t = useI18nT()
  return (
    <ol className="guest__pitch-steps">
      {accessRequestSteps.map((step) => (
        <li key={step}>
          <strong>{t(`guest:accessRequestView.steps.${step}.title`)}</strong>
          <span>{t(`guest:accessRequestView.steps.${step}.description`)}</span>
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
      <p>{t(`${prefix}.description`)}</p>
      {accessRequest ? <AccessRequestSteps /> : <PitchTags />}
    </section>
  )
}
