import React from 'react'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

type Props = {
  id: string
  title: string
  titleParams?: Record<string, unknown>
  description?: string
  descriptionParams?: Record<string, unknown>
  danger?: boolean
  hidden?: boolean
  children: React.ReactNode
}

/**
 * Card grouping related fields of the user edit page, with a title and a short description.
 */
export const UserEditSection = (props: Props) => {
  const { id, title, titleParams, description, descriptionParams, danger = false, hidden = false, children } = props
  const i18n = useI18n()
  const titleId = `${id}-title`
  return (
    <section
      aria-labelledby={titleId}
      className={classNames('user-edit-section', { 'user-edit-section--danger': danger })}
      hidden={hidden}
      id={id}
    >
      <div className="user-edit-section__header">
        <h2 className="user-edit-section__title" id={titleId}>
          {i18n.t(title, titleParams)}
        </h2>
        {description && <p className="user-edit-section__description">{i18n.t(description, descriptionParams)}</p>}
      </div>
      <div className="user-edit-section__body">{children}</div>
    </section>
  )
}

type RowProps = {
  title: string
  description?: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

/**
 * Row of a section: a title with an optional description on the left, a control on the right.
 */
export const UserEditSectionRow = (props: RowProps) => {
  const { title, description, icon, children } = props
  const i18n = useI18n()
  return (
    <div className="user-edit-section__row">
      {icon}
      <div className="user-edit-section__row-text">
        <span className="user-edit-section__row-title">{i18n.t(title)}</span>
        {description && <span className="user-edit-section__row-description">{i18n.t(description)}</span>}
      </div>
      {children}
    </div>
  )
}
