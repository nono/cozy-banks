// TODO Move this to Harvest

import React from 'react'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Infos from 'cozy-ui/transpiled/react/Infos'
import Text, { SubTitle } from 'cozy-ui/transpiled/react/Text'
import Icon from 'cozy-ui/transpiled/react/Icon'

import { getErrorLocaleBound, KonnectorJobError } from 'cozy-harvest-lib'
import ReconnectTriggerButton from 'ducks/transactions/TransactionPageErrors/ReconnectTriggerButton'
const TriggerErrorCard = ({ index, count, error, className }) => {
  const { t, lang } = useI18n()

  const { bankName, trigger } = error

  const konnError = new KonnectorJobError(trigger.current_state.last_error)
  // We do not have a full konnector object here but we can create a simple
  // one, that is sufficient for getErrorLocaleBound, from the information in
  // the trigger
  const konnector = {
    slug: trigger.message.slug,
    name: bankName
  }

  const errorTitle = getErrorLocaleBound(konnError, konnector, lang, 'title')

  return (
    <Infos
      theme="danger"
      className={'u-bdrs-0 u-maw-none u-p-1-half ' + (className || '')}
      action={<ReconnectTriggerButton trigger={trigger} />}
      description={
        <>
          <SubTitle className="u-error">
            {errorTitle + (count > 1 ? ` (${index + 1}/${count})` : '')}
          </SubTitle>
          <Text>
            <Icon icon="warning" className="u-mr-half" />
            {t('Transactions.trigger-error.description', { bankName })}
          </Text>
        </>
      }
    />
  )
}

export const DumbTriggerErrorCard = TriggerErrorCard

export default TriggerErrorCard
