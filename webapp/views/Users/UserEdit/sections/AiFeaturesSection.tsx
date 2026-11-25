import React from 'react'

import UserAiSettingsPanel from '@webapp/components/ai/UserAiSettingsPanel'
import { UserEditSection } from '../UserEditSection'

type Props = {
  aiSaveRef: React.Ref<() => Promise<void>>
  // false until the AI settings are loaded, and when AI features are disabled on the server
  available: boolean
  onAvailableChange: (available: boolean) => void
  onDirtyChange: (dirty: boolean) => void
}

/**
 * AI features settings of the logged-in user; hidden until the server confirms that AI features are available.
 */
export const AiFeaturesSection = (props: Props) => {
  const { aiSaveRef, available, onAvailableChange, onDirtyChange } = props
  return (
    // kept mounted while hidden: the panel loads the settings and reports whether AI features are available
    <UserEditSection
      description="usersView:profile.sections.aiFeaturesDescription"
      hidden={!available}
      id="user-edit-ai-features"
      title="userAiSettings:section"
    >
      <UserAiSettingsPanel
        legend={null}
        onAvailableChange={onAvailableChange}
        onDirtyChange={onDirtyChange}
        ref={aiSaveRef}
      />
    </UserEditSection>
  )
}
