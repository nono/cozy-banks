import React from 'react'
import PropTypes from 'prop-types'
import { withBreakpoints } from 'cozy-ui/react'
import cx from 'classnames'
import { flowRight as compose } from 'lodash'
import { translate, Icon } from 'cozy-ui/react'
import AppIcon from 'cozy-ui/react/AppIcon'
import { Figure } from 'components/Figure'
import {
  getAccountLabel,
  getAccountUpdateDateDistance,
  distanceInWords,
  getAccountInstitutionLabel,
  getAccountInstitutionSlug
} from 'ducks/account/helpers'
import styles from './AccountRow.styl'
import { getCozyURL, isSecureProtocol } from 'cozy-stack-client/dist/urls'

class AccountRow extends React.PureComponent {
  static propTypes = {
    account: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    breakpoints: PropTypes.object.isRequired,
    t: PropTypes.func.isRequired,
    warningLimit: PropTypes.number.isRequired
  }

  render() {
    const {
      account,
      onClick,
      breakpoints: { isMobile },
      t,
      warningLimit
    } = this.props

    const today = new Date()
    const updateDistance = getAccountUpdateDateDistance(account, today)
    const updatedAt = t(distanceInWords(updateDistance), {
      nbDays: updateDistance
    })

    const hasWarning = account.balance < warningLimit
    const hasAlert = account.balance < 0
    const institutionSlug = getAccountInstitutionSlug(account)

    const cozyURL = getCozyURL()

    return (
      <li
        className={cx(styles.AccountRow, {
          [styles['AccountRow--hasWarning']]: hasWarning,
          [styles['AccountRow--hasAlert']]: hasAlert
        })}
        onClick={onClick}
      >
        <div className={styles.AccountRow__column}>
          <div className={styles.AccountRow__logo}>
            {institutionSlug && (
              <AppIcon
                app={institutionSlug}
                domain={cozyURL.host}
                secure={isSecureProtocol(cozyURL)}
              />
            )}
          </div>
          <div className={styles.AccountRow__labelUpdatedAtWrapper}>
            <div className={styles.AccountRow__label}>
              {getAccountLabel(account)}
            </div>
            <div
              className={cx(styles.AccountRow__updatedAt, {
                [styles['AccountRow__updatedAt--old']]: updateDistance > 1
              })}
            >
              <Icon
                icon="sync"
                width="10"
                color="currentColor"
                className={styles.AccountRow__updatedAtIcon}
              />
              {updatedAt}
            </div>
          </div>
        </div>
        {!isMobile && (
          <div
            className={cx(
              styles.AccountRow__column,
              styles['AccountRow__column--secondary']
            )}
          >
            N°
            {account.number}
          </div>
        )}
        {!isMobile && (
          <div
            className={cx(
              styles.AccountRow__column,
              styles['AccountRow__column--secondary']
            )}
          >
            {getAccountInstitutionLabel(account)}
          </div>
        )}
        <Figure
          currency="€"
          total={account.balance}
          className={cx(styles.AccountRow__figure, styles.AccountRow__column)}
          totalClassName={styles.AccountRow__figure}
          currencyClassName={styles.AccountRow__figure}
        />
      </li>
    )
  }
}

export default compose(
  withBreakpoints(),
  translate()
)(AccountRow)