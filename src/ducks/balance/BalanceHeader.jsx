import React, { memo } from 'react'
import { flowRight as compose } from 'lodash'
import { useI18n } from 'cozy-ui/transpiled/react'

import { transactionsConn } from 'doctypes'
import { Padded } from 'components/Spacing'
import Header from 'components/Header'
import { PageTitle } from 'components/Title'
import KonnectorUpdateInfo from 'components/KonnectorUpdateInfo'
import History, { HistoryFallback } from 'ducks/balance/History'
import HeaderTitle from 'ducks/balance/HeaderTitle'
import Delayed from 'components/Delayed'
import { queryConnect } from 'cozy-client'
import flag from 'cozy-flags'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'

import { MobileBarSearchIconLink } from 'ducks/search/SearchIconLink'
import styles from 'ducks/balance/BalanceHeader.styl'

const BalanceHeader = ({
  accountsBalance,
  accounts,
  subtitleParams,
  onClickBalance,
  transactions
}) => {
  const { isMobile } = useBreakpoints()
  const { t } = useI18n()
  const titlePaddedClass = isMobile ? 'u-p-0' : 'u-pb-0'
  const subtitle = subtitleParams
    ? t('BalanceHistory.checked_accounts', subtitleParams)
    : t('BalanceHistory.all_accounts')

  return (
    <Header className={styles.BalanceHeader} theme="inverted">
      <MobileBarSearchIconLink />
      {isMobile && (
        <Padded className={titlePaddedClass}>
          <PageTitle>{t('Balance.title')}</PageTitle>
        </Padded>
      )}
      <HeaderTitle
        balance={accountsBalance}
        subtitle={subtitle}
        onClickBalance={onClickBalance}
      />
      {accounts && (
        <Delayed
          fallback={<HistoryFallback />}
          delay={flag('balance.no-delay-history') ? 0 : 1000}
        >
          <History
            animation={!flag('balance.no-history-animation')}
            accounts={accounts}
            transactions={transactions}
          />
        </Delayed>
      )}
      <KonnectorUpdateInfo />
    </Header>
  )
}

export const DumbBalanceHeader = BalanceHeader

export default compose(
  memo,
  queryConnect({
    transactions: transactionsConn
  })
)(BalanceHeader)
