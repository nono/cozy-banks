import React, { useMemo } from 'react'
import { Link } from 'react-router'
import cx from 'classnames'
import orderBy from 'lodash/orderBy'

import { useQuery, isQueryLoading, hasQueryBeenLoaded } from 'cozy-client'
import { ButtonLink } from 'cozy-ui/transpiled/react/Button'
import CompositeRow from 'cozy-ui/transpiled/react/CompositeRow'
import Empty from 'cozy-ui/transpiled/react/Empty'
import useBreakpoints from 'cozy-ui/transpiled/react/hooks/useBreakpoints'
import { useI18n } from 'cozy-ui/transpiled/react/I18n'
import Breadcrumbs from 'cozy-ui/transpiled/react/Breadcrumbs'
import { Media, Img, Bd } from 'cozy-ui/transpiled/react/Media'
import flag from 'cozy-flags'

import Loading from 'components/Loading'
import distanceInWords from 'date-fns/distance_in_words'
import CategoryIcon from 'ducks/categories/CategoryIcon'
import { recurrenceConn } from 'doctypes'
import BarTheme from 'ducks/bar/BarTheme'
import Table, { TdSecondary } from 'components/Table'

import Padded from 'components/Spacing/Padded'
import Header from 'components/Header'
import BackButton from 'components/BackButton'
import PageTitle from 'components/Title/PageTitle'
import Figure from 'cozy-ui/transpiled/react/Figure'

import { useTrackPage } from 'ducks/tracking/browser'

import frLocale from 'date-fns/locale/fr'
import enLocale from 'date-fns/locale/en'
import esLocale from 'date-fns/locale/es'

import styles from './styles.styl'
import {
  getFrequencyText,
  getAmount,
  getCurrency,
  getLabel,
  getCategories
} from './utils'

import withError from 'components/withError'

import { useHistory } from 'components/RouterContext'

const BundleFrequency = ({ bundle }) => {
  const { t } = useI18n()
  return <>{getFrequencyText(t, bundle)}</>
}

const dateFnsLocales = {
  en: enLocale,
  fr: frLocale,
  es: esLocale
}

const BundleDistance = ({ bundle }) => {
  const { lang } = useI18n()
  const d = useMemo(
    () =>
      distanceInWords(Date.now(), bundle.latestDate, {
        addSuffix: true,
        locale: dateFnsLocales[lang] || dateFnsLocales.en
      }),
    [bundle, lang]
  )
  return <>{d}</>
}

const BundleMobileRow = ({ bundle }) => {
  const history = useHistory()
  const catId = getCategories(bundle)[0]
  return (
    <CompositeRow
      onClick={() => history.push(`/analysis/recurrence/${bundle._id}`)}
      image={<CategoryIcon categoryId={catId} />}
      className={cx('u-pv-half u-ph-1 u-c-pointer', styles.BundleRow)}
      key={bundle._id}
      primaryText={getLabel(bundle)}
      secondaryText={
        <>
          <BundleDistance bundle={bundle} /> -{' '}
          <BundleFrequency bundle={bundle} />
        </>
      }
      right={<BundleAmount bundle={bundle} />}
    />
  )
}

const BundleAmount = ({ bundle }) => {
  const amount = getAmount(bundle)
  const currency = getCurrency(bundle)
  return <Figure total={amount} symbol={currency} coloredPositive />
}

const BundleDesktopRow = ({ bundle }) => {
  const history = useHistory()
  const catId = getCategories(bundle)[0]
  return (
    <tr
      className="u-c-pointer"
      onClick={() => history.push(`analysis/recurrence/${bundle._id}`)}
    >
      <td className={styles.ColumnSizeLabel}>
        <Media>
          <Img className="u-mr-1">
            <CategoryIcon categoryId={catId} />
          </Img>
          <Bd>{getLabel(bundle)}</Bd>
        </Media>
      </td>
      <TdSecondary className={styles.ColumnSizeLastOccurence}>
        <BundleDistance bundle={bundle} />
      </TdSecondary>
      <TdSecondary className={styles.ColumnSizeFrequency}>
        <BundleFrequency bundle={bundle} />
      </TdSecondary>
      <TdSecondary className={styles.ColumnSizeAmount}>
        <BundleAmount bundle={bundle} />
      </TdSecondary>
    </tr>
  )
}

const BundleRow = ({ bundle }) => {
  const { isMobile } = useBreakpoints()
  return isMobile ? (
    <BundleMobileRow bundle={bundle} />
  ) : (
    <BundleDesktopRow bundle={bundle} />
  )
}

const BundlesTableHead = () => {
  const { t } = useI18n()
  return (
    <Table color="primary">
      <thead>
        <tr>
          <td className={styles.ColumnSizeLabel}>
            {t('Recurrence.table.label')}
          </td>
          <td className={styles.ColumnSizeLastOccurence}>
            {t('Recurrence.table.last-occurence')}
          </td>
          <td className={styles.ColumnSizeFrequency}>
            {t('Recurrence.table.frequency')}
          </td>
          <td className={styles.ColumnSizeAmount}>
            {t('Recurrence.table.amount')}
          </td>
        </tr>
      </thead>
    </Table>
  )
}

const BundleMobileWrapper = ({ children }) => {
  return <div className={styles.RecurrencesMobileContent}>{children}</div>
}

const BundlesTable = ({ children }) => {
  return (
    <Table>
      <tbody>{children}</tbody>
    </Table>
  )
}

const sortBundlesForViewing = bundles => {
  return orderBy(
    bundles,
    [bundle => getCategories(bundle)[0], bundle => bundle.latestDate],
    ['desc', 'desc']
  )
}

const RecurrencesPage = () => {
  const history = useHistory()
  const { isMobile } = useBreakpoints()
  const bundleCol = useQuery(recurrenceConn.query, recurrenceConn)
  const { data: rawBundles } = bundleCol
  const bundles = sortBundlesForViewing(rawBundles)

  const { t } = useI18n()
  const BundlesWrapper = isMobile ? BundleMobileWrapper : BundlesTable

  useTrackPage('recurrences')

  return (
    <>
      <BarTheme theme="primary" />
      <Header fixed theme="inverted">
        {!isMobile ? (
          <>
            <Padded>
              <Breadcrumbs
                items={[
                  {
                    name: t('Recurrence.title'),
                    onClick: () => history.push('/analysis/recurrence')
                  }
                ]}
                theme="primary"
              />
              {flag('debug') ? (
                <Link to="/recurrencedebug">Go to debug</Link>
              ) : null}
            </Padded>
            <BackButton theme="primary" />
            {isMobile ? null : <BundlesTableHead />}
          </>
        ) : null}
        {isMobile ? (
          <>
            <PageTitle>{t('Recurrence.title')}</PageTitle>
          </>
        ) : null}
      </Header>
      {isQueryLoading(bundleCol) && !hasQueryBeenLoaded(bundleCol) ? (
        <Padded>
          <Loading />
        </Padded>
      ) : bundles && bundles.length > 0 ? (
        <BundlesWrapper>
          {bundles.map(bundle => (
            <BundleRow key={bundle._id} bundle={bundle} />
          ))}
        </BundlesWrapper>
      ) : (
        <Padded>
          <Empty
            icon={{}}
            title={t('Recurrence.no-recurrences.title')}
            text={t('Recurrence.no-recurrences.text')}
          />
        </Padded>
      )}
    </>
  )
}

const RecurrenceError = ({ error }) => {
  const { t } = useI18n()

  return (
    <Padded>
      <p>{t('Recurrence.display-error')}</p>
      <ButtonLink
        href="#/recurrencedebug"
        label={t('Recurrence.go-to-debug-page')}
      />
      <pre>
        {error.message}
        {error.stack}
      </pre>
    </Padded>
  )
}

export default withError(RecurrencesPage, RecurrenceError)
