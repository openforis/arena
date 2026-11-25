import React from 'react'

import { Button } from '@webapp/components/buttons'
import { useAskAssistantAboutRow } from '@webapp/components/ai/Assistant/cleaning/useCleaningArea'
import { TestId } from '@webapp/utils/testId'

type Props = { row: any }

/**
 * "Ask the assistant" action of a validation report row. The report renders it only when the Cleaning area is
 * available (the status is computed once for the whole report).
 * @param {Props} props - Props.
 * @returns {React.ReactElement} The button.
 */
export const AskAssistantButton = ({ row }: Props) => {
  const askAssistant = useAskAssistantAboutRow()
  return (
    <Button
      className="validation-report__ask-assistant"
      iconClassName="icon-bubbles icon-12px"
      showLabel={false}
      title="aiCleaning.rowAction.askAssistant"
      variant="text"
      testId={TestId.validationReport.askAssistantBtn}
      onClick={(event: React.MouseEvent) => {
        // the row itself opens the record
        event.stopPropagation()
        askAssistant(row)
      }}
    />
  )
}
