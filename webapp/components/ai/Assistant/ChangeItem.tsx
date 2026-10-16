import './ChangeItem.scss'

import React from 'react'

import type { OperationConflict, OperationResult } from '@webapp/ai/changeSets/types'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import type { CardValue } from './changeSetCardModel'
import { CardValueView } from './CardValueView'
import {
  getCategoryUuid,
  getConflictReasonText,
  getItemDetailLines,
  getItemLang,
  getItemKind,
  getResultTitle,
  hasCardValue,
  isCategoryItem,
} from './changeItemModel'
import type { ReviewItem } from './changeSetReviewModel'

/**
 * Name of the node definition of a change: a button that shows it in the form designer, disabled while there is
 * nothing to show (a proposed node definition doesn't exist yet).
 * @param {object} props - Props.
 * @param {string} props.name - Node definition name.
 * @param {boolean} props.exists - The node definition exists in the survey.
 * @param {Function} props.onClick - Shows it in the form designer.
 * @returns {React.ReactElement} The name.
 */
export const ChangeItemName = ({ name, exists, onClick }: { name: string; exists: boolean; onClick: () => void }) => (
  <button className="ai-change-item__name" disabled={!exists} onClick={onClick} type="button">
    {name}
  </button>
)

/**
 * Result of an Apply on a change ("Applied", "Conflict"…), with its message as the tooltip.
 * @param {object} props - Props.
 * @param {OperationResult} props.result - Result.
 * @param {string} [props.testId] - Test id.
 * @returns {React.ReactElement} The status.
 */
export const ChangeItemStatus = ({ result, testId }: { result: OperationResult; testId?: string }) => {
  const t = useI18nT({ unescapeHtml: true })
  return (
    <span
      className={`ai-change-item__status ai-change-item__status--${result.status}`}
      data-testid={testId}
      title={getResultTitle(result, t)}
    >
      {t(`aiAssistant.card.status.${result.status}`)}
    </span>
  )
}

/**
 * Why an operation can't be applied, as a line under its row (visible, not only a tooltip): the survey changed since
 * the proposal, or the designer's rules refuse the change.
 * @param {object} props - Props.
 * @param {OperationConflict} props.conflict - The conflict of the operation.
 * @returns {React.ReactElement} The reason.
 */
export const ChangeItemConflict = ({ conflict }: { conflict: OperationConflict }) => {
  const t = useI18nT({ unescapeHtml: true })
  return (
    <p className="ai-change-item__conflict" data-testid={TestId.aiAssistant.conflictReason}>
      {getConflictReasonText(t, conflict.reason, conflict.params)}
    </p>
  )
}

/**
 * A language code, next to a text in that language.
 * @param {object} props - Props.
 * @param {string} props.lang - Language code.
 * @returns {React.ReactElement} The tag.
 */
export const LangTag = ({ lang }: { lang: string }) => <code className="ai-change-item__lang">{lang}</code>

/**
 * The text a proposed translation overwrites, under the proposal; nothing when there was none.
 * @param {object} props - Props.
 * @param {CardValue|null} props.value - Current value.
 * @returns {React.ReactElement|null} The line.
 */
export const ChangeItemReplaces = ({ value }: { value: CardValue | null }) => {
  const t = useI18nT({ unescapeHtml: true })
  if (!value || !hasCardValue(value)) return null
  return (
    <span className="ai-change-item__replaces">
      {t('aiAssistant.card.replaces')}:{' '}
      <s>
        <CardValueView value={value} />
      </s>
    </span>
  )
}

/**
 * A translation on two lines: the original text, then the proposal (and the text it overwrites), each with its
 * language.
 * @param {object} props - Props.
 * @param {ReviewItem} props.item - Translation (an item with a source).
 * @returns {React.ReactElement|null} The pair.
 */
export const ChangeItemTranslationPair = ({ item }: { item: ReviewItem }) => {
  const { source } = item
  if (!source) return null
  return (
    <dl className="ai-change-item__pair">
      <dt>
        <LangTag lang={source.lang} />
      </dt>
      <dd className="ai-change-item__original" data-testid={TestId.aiAssistant.translationSource} lang={source.lang}>
        {source.text}
      </dd>
      <dt>
        <LangTag lang={getItemLang(item)} />
      </dt>
      <dd>
        <CardValueView value={item.to} />
        <ChangeItemReplaces value={item.from} />
      </dd>
    </dl>
  )
}

/**
 * What a change is about, next to its item: "Label", "Description", "Read only"...
 * @param {object} props - Props.
 * @param {ReviewItem} props.item - Node definition change.
 * @returns {React.ReactElement} The tag.
 */
export const ChangeItemKind = ({ item }: { item: ReviewItem }) => {
  const t = useI18nT({ unescapeHtml: true })
  const kind = getItemKind(item)
  return <span className="ai-change-item__kind">{t(kind.key, kind.params)}</span>
}

/**
 * What a new node definition sets besides its type, name and label (key, multiple, read only, the labels in other
 * languages, descriptions); nothing for other changes.
 * @param {object} props - Props.
 * @param {ReviewItem} props.item - Change.
 * @returns {React.ReactElement|null} The list.
 */
export const ChangeItemDetails = ({ item }: { item: ReviewItem }) => {
  const t = useI18nT({ unescapeHtml: true })
  const lines = getItemDetailLines(item, t)
  if (lines.length === 0) return null
  return (
    <dl className="ai-change-item__details">
      {lines.map((line) => (
        <div className="ai-change-item__detail" key={line.key}>
          <dt>{line.title}</dt>
          <dd>
            <CardValueView value={line.value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * What a card row changes: a translation shows the original text over the proposal; any other change its current
 * value, an arrow and the proposed value.
 * @param {object} props - Props.
 * @param {ReviewItem} props.item - Change.
 * @returns {React.ReactElement} The change.
 */
const CardRowChange = ({ item }: { item: ReviewItem }) => {
  if (item.source) return <ChangeItemTranslationPair item={item} />
  return (
    <>
      <div className="ai-assistant-card__diff">
        {item.from && (
          <>
            <span className="ai-assistant-card__from">
              <CardValueView value={item.from} />
            </span>
            <span aria-hidden="true">→</span>
          </>
        )}
        <span className="ai-assistant-card__to">
          <CardValueView value={item.to} />
        </span>
      </div>
      <ChangeItemDetails item={item} />
    </>
  )
}

/**
 * One change of a card: checkbox (pending only), item, what changes, status and the change. A node definition change
 * shows the node definition's name; a category label shows the item. A translation shows what it is ("Label") and
 * its languages on the original and proposed texts; other label changes show their language in the title.
 * @param {object} props - Props.
 * @param {ReviewItem} props.item - Change.
 * @param {boolean} props.pending - It can still be applied.
 * @param {boolean} props.selected - It is selected.
 * @param {OperationConflict} [props.conflict] - The survey changed since the proposal, or the designer's rules refuse
 *   the change: it can't be selected, and the row says why.
 * @param {boolean} props.exists - The node definition exists in the survey.
 * @param {Function} props.onToggle - Toggles the selection.
 * @param {Function} props.onNameClick - Shows the node definition in the form designer.
 * @returns {React.ReactElement} The row.
 */
export const ChangeItemRow = ({
  item,
  pending,
  selected,
  conflict,
  exists,
  onToggle,
  onNameClick,
}: {
  item: ReviewItem
  pending: boolean
  selected: boolean
  conflict?: OperationConflict
  exists: boolean
  onToggle: () => void
  onNameClick: () => void
}) => {
  const t = useI18nT({ unescapeHtml: true })
  const category = isCategoryItem(item)
  const translation = Boolean(item.source)
  const lang = getItemLang(item)
  const title = category
    ? t('aiAssistant.card.categoryItem', { ref: item.name, level: item.detail ?? '' })
    : t(item.field.key, item.field.params)
  const testId = category
    ? TestId.aiAssistant.categoryLabelRow(getCategoryUuid(item), item.name, lang)
    : TestId.aiAssistant.changeSetRow(item.name)
  return (
    <li className="ai-assistant-card__row" data-testid={testId}>
      {pending && (
        <input
          aria-label={category ? `${title} (${lang})` : `${item.name}: ${title}`}
          checked={selected && !conflict}
          disabled={conflict !== undefined}
          onChange={onToggle}
          type="checkbox"
        />
      )}
      <div className="ai-assistant-card__row-body">
        <div className="ai-assistant-card__row-title">
          {category && <span>{title}</span>}
          {category && !translation && <code>{lang}</code>}
          {!category && <ChangeItemName exists={exists} name={item.name} onClick={onNameClick} />}
          {!category && (translation ? <ChangeItemKind item={item} /> : <span>{title}</span>)}
          {item.result && <ChangeItemStatus result={item.result} testId={TestId.aiAssistant.changeSetRowStatus} />}
        </div>
        <CardRowChange item={item} />
        {conflict && <ChangeItemConflict conflict={conflict} />}
      </div>
    </li>
  )
}
