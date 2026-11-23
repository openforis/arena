import { getLanguageLabel } from '@core/app/languages'

type BadgeProps = {
  lang?: string
  compact?: boolean
}

const Badge = ({ lang = '', compact = false }: BadgeProps) => (
  <div className="badge-of labels-editor__badge" title={compact ? getLanguageLabel(lang) : null}>
    {compact ? lang : getLanguageLabel(lang)}
  </div>
)

export default Badge
