import './NodeDefSettingsSection.scss'

import React, { useId } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'

/**
 * Groups related node definition settings with a titled section and optional description for clearer scanning.
 * @param {object} props - Component props.
 * @param {string} props.titleKey - i18n key for the section title.
 * @param {string} [props.descriptionKey] - i18n key for optional introductory text below the title.
 * @param {import('react').ReactNode} props.children - Section content (typically FormItem and expression blocks).
 * @param {string} [props.testId] - Optional data-testid for automated tests.
 * @param {string} [props.className] - Optional additional class names for the root element.
 * @returns {import('react').JSX.Element} Section markup with accessible heading.
 */
const NodeDefSettingsSection = (props) => {
  const { titleKey, descriptionKey = null, children, testId = null, className = '' } = props

  const i18n = useI18n()
  const reactId = useId()
  const titleId = `node-def-settings-section-title-${reactId}`

  const title = i18n.t(titleKey, { interpolation: { escapeValue: false } })
  const description =
    descriptionKey !== null && descriptionKey !== ''
      ? i18n.t(descriptionKey, { interpolation: { escapeValue: false } })
      : null

  return (
    <section
      className={classNames('node-def-settings-section', className)}
      data-testid={testId ?? undefined}
      aria-labelledby={titleId}
    >
      <header className="node-def-settings-section__header">
        <h3 className="node-def-settings-section__title" id={titleId}>
          {title}
        </h3>
        {description ? <p className="node-def-settings-section__description">{description}</p> : null}
      </header>
      <div className="node-def-settings-section__body">{children}</div>
    </section>
  )
}

NodeDefSettingsSection.propTypes = {
  titleKey: PropTypes.string.isRequired,
  descriptionKey: PropTypes.string,
  children: PropTypes.node.isRequired,
  testId: PropTypes.string,
  className: PropTypes.string,
}

export default NodeDefSettingsSection
