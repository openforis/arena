import { useCallback } from 'react'

import { useI18n } from '@webapp/store/system'

export type UserEditNavItem = {
  id: string
  label: string
  visible?: boolean
}

type Props = {
  items: UserEditNavItem[]
}

/**
 * Links to the sections of the user edit page.
 */
export const UserEditNav = (props: Props) => {
  const { items } = props
  const i18n = useI18n()

  const onClick = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <nav aria-label={i18n.t('usersView:profile.sectionsNav')} className="user-edit-nav">
      {items.map(({ id, label }) => (
        <button key={id} className="user-edit-nav__item" onClick={() => onClick(id)} type="button">
          {i18n.t(label)}
        </button>
      ))}
    </nav>
  )
}
