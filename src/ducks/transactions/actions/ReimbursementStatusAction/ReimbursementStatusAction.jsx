import React from 'react'
import { connect } from 'react-redux'
import Icon from 'cozy-ui/transpiled/react/Icon'
import Chip from 'cozy-ui/transpiled/react/Chip'
import Alerter from 'cozy-ui/transpiled/react/Alerter'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'

import {
  getReimbursementStatus,
  isReimbursementLate,
  REIMBURSEMENTS_STATUS
} from 'ducks/transactions/helpers'
import TransactionModalRow, {
  RowArrow
} from 'ducks/transactions/TransactionModalRow'
import ReimbursementStatusModal from 'ducks/transactions/actions/ReimbursementStatusAction/ReimbursementStatusModal'
import { trackEvent } from 'ducks/tracking/browser'

import iconReimbursement from 'assets/icons/icon-reimbursement.svg'
import { logException } from 'lib/sentry'
import cx from 'classnames'
import { translate } from 'cozy-ui/transpiled/react'
import { flowRight as compose } from 'lodash'
import { withClient } from 'cozy-client'
import { getHealthReimbursementLateLimitSelector } from 'ducks/reimbursements/selectors'

const TransactionItem = ({
  transaction,
  healthReimbursementLateLimit,
  onClick
}) => {
  const { t } = useI18n()
  const status = getReimbursementStatus(transaction)
  const isLate = isReimbursementLate(transaction, healthReimbursementLateLimit)

  if (status === REIMBURSEMENTS_STATUS.noReimbursement) {
    return null
  }

  const translateKey = isLate ? 'late' : status

  return (
    <Chip
      size="small"
      variant="outlined"
      theme={isLate ? 'error' : 'normal'}
      onClick={onClick}
      className={cx({ 'u-valid': status === 'reimbursed' })}
    >
      {t(`Transactions.actions.reimbursementStatus.${translateKey}`)}
      {status === 'pending' && (
        <>
          <Chip.Separator />
          <Icon icon="hourglass" size={12} />
        </>
      )}
    </Chip>
  )
}

const ModalItem = ({ transaction, healthReimbursementLateLimit, onClick }) => {
  const { t } = useI18n()

  const status = getReimbursementStatus(transaction)
  const isLate = isReimbursementLate(transaction, healthReimbursementLateLimit)
  const translateKey = isLate ? 'late' : status
  const label = t(`Transactions.actions.reimbursementStatus.${translateKey}`)

  return (
    <TransactionModalRow
      iconLeft={<Icon icon={iconReimbursement} />}
      iconRight={<RowArrow />}
      onClick={onClick}
    >
      {label}
    </TransactionModalRow>
  )
}

const reimbursementStatusToEventName = {
  pending: 'attente_remboursement',
  reimbursed: 'rembourse',
  'no-reimbursement': 'pas_attente_remboursement '
}

export class DumbReimbursementStatusAction extends React.PureComponent {
  state = {
    showModal: false
  }

  showModal = () => this.setState({ showModal: true })
  hideModal = () => this.setState({ showModal: false })

  handleChange = async e => {
    const { transaction, client, t } = this.props
    const value = e.target.value
    transaction.reimbursementStatus = value

    this.hideModal()

    try {
      await client.save(transaction)
    } catch (err) {
      logException(err)
      Alerter.error(t('Transactions.reimbursementStatusUpdateError'))
    }

    trackEvent({
      name: reimbursementStatusToEventName[value]
    })
  }

  render() {
    const {
      isModalItem,
      transaction,
      healthReimbursementLateLimit
    } = this.props

    const Item = isModalItem ? ModalItem : TransactionItem
    return (
      <>
        <Item
          transaction={transaction}
          healthReimbursementLateLimit={healthReimbursementLateLimit}
          onClick={this.showModal}
        />
        {this.state.showModal && (
          <ReimbursementStatusModal
            into="body"
            dismissAction={this.hideModal}
            mobileFullscreen
            transaction={transaction}
            onChange={this.handleChange}
            brands={this.props.actionProps.brands}
          />
        )}
      </>
    )
  }
}

const ReimbursementStatusAction = compose(
  translate(),
  withClient,
  connect(state => ({
    healthReimbursementLateLimit: getHealthReimbursementLateLimitSelector(state)
  }))
)(DumbReimbursementStatusAction)

export default ReimbursementStatusAction
