import { useI18nT } from '@webapp/store/system'

const defaultTags = ['forestInventories', 'questionnaires', 'multiCycle', 'statisticalAnalysis']
const accessRequestTags = ['freeAndOpenSource', 'openForis', 'upToFiveSurveys']

type Props = {
  accessRequest?: boolean
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
  const tags = accessRequest ? accessRequestTags : defaultTags
  return (
    <section className="guest__pitch">
      <h1>{t(`${prefix}.title`)}</h1>
      <p>{t(`${prefix}.description`)}</p>
      <ul className="guest__pitch-tags">
        {tags.map((tag) => (
          <li key={tag}>{t(`guest:pitch.tags.${tag}`)}</li>
        ))}
      </ul>
    </section>
  )
}
