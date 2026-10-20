import type { ReactNode } from 'react'

type TransTitleProps = {
  children?: ReactNode
}

/**
 * Heading used as placeholder in i18n Trans components, which fill it with the translated text.
 *
 * @param {object} props - The component props.
 * @param {ReactNode} [props.children] - The heading content.
 * @returns {JSX.Element} - The heading element.
 */
export const TransTitle = ({ children = null }: TransTitleProps) => <h2>{children}</h2>
