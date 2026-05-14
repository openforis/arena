import './NodeDefSettingsSection.scss'

import React, { useId } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { ButtonIconInfo } from '@webapp/components/buttons'
import { useI18n } from '@webapp/store/system'

/**
 * Groups related node definition settings with a titled section and optional tooltip help.
 * @param {object} props - Component props.
 * @param {string} props.titleKey - i18n key for the section title.
 * @param {string} [props.descriptionKey] - Optional i18n key for help text shown in the info icon tooltip (not inline).
 * @param {object} [props.descriptionTitleParams] - Optional i18n params for `descriptionKey`.
 * @param {boolean} [props.isDescriptionMarkdown] - When true, tooltip body is rendered as markdown.
 * @param {import('react').ReactNode} props.children - Section content (typically FormItem and expression blocks).
 * @param {string} [props.testId] - Optional data-testid for automated tests.
 * @param {string} [props.className] - Optional additional class names for the root element.
 * @returns {import('react').JSX.Element} Section markup with accessible heading.
 */
const NodeDefSettingsSection = (props) => {
  const {
    titleKey,
    descriptionKey = null,
    descriptionTitleParams = null,
    isDescriptionMarkdown = false,
    children,
    testId = null,
    className = '',
  } = props

  const i18n = useI18n()
  const reactId = useId()
  const titleId = `node-def-settings-section-title-${reactId}`

  const title = i18n.t(titleKey, { interpolation: { escapeValue: false } })
  const hasDescriptionTooltip = descriptionKey !== null && descriptionKey !== '' && descriptionKey !== undefined

  return (
    <section
      className={classNames('node-def-settings-section', className)}
      data-testid={testId ?? undefined}
      aria-labelledby={titleId}
    >
      <header className="node-def-settings-section__header">
        <div className="node-def-settings-section__title-row">
          <h3 className="node-def-settings-section__title" id={titleId}>
            {title}
          </h3>
          {hasDescriptionTooltip ? (
            <ButtonIconInfo
              title={descriptionKey}
              titleParams={descriptionTitleParams ?? undefined}
              isTitleMarkdown={isDescriptionMarkdown}
            />
          ) : null}
        </div>
      </header>
      <div className="node-def-settings-section__body">{children}</div>
    </section>
  )
}

NodeDefSettingsSection.propTypes = {
  titleKey: PropTypes.string.isRequired,
  descriptionKey: PropTypes.string,
  descriptionTitleParams: PropTypes.object,
  isDescriptionMarkdown: PropTypes.bool,
  children: PropTypes.node.isRequired,
  testId: PropTypes.string,
  className: PropTypes.string,
}

export default NodeDefSettingsSection
