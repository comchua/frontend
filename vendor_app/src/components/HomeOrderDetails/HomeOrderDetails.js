import { View, Pressable } from 'react-native'
import React, { useContext, useState, useRef, useEffect } from 'react'
import styles from './styles'
import { TextDefault } from '../../components'
import { colors, MAX_TIME } from '../../utilities'
import { Badge } from 'react-native-elements'
import { Configuration } from '../../ui/context'
import { useSubscription, gql } from '@apollo/client'
import moment from 'moment'
import { subscriptionOrder } from '../../apollo'
import CountDown from 'react-native-countdown-component'
import { useTranslation } from 'react-i18next'
import { getIsAcceptButtonVisible } from '../../utilities/customFunctions'

function HomeOrderDetails(props) {
  const { activeBar, navigation } = props
  const {
    orderId,
    orderAmount,
    paymentMethod,
    orderDate,
    _id,
    preparationTime,
    createdAt,
    isRinged
  } = props?.order
  const timeNow = new Date()
  const { t } = useTranslation()
  const date = new Date(orderDate)
  const acceptanceTime = moment(date).diff(timeNow, 'seconds')
  // current
  const createdTime = new Date(createdAt)
  var remainingTime = moment(createdTime)
    .add(MAX_TIME, 'seconds')
    .diff(timeNow, 'seconds')
  const configuration = useContext(Configuration.Context)
  const [isOvertime, setIsOvertime] = useState(false)

  // prepTime
  const prep = new Date(preparationTime)
  const diffTime = prep - timeNow
  const totalPrep = diffTime > 0 ? diffTime / 1000 : 0

  // accept time
  const [isAcceptButtonVisible, setIsAcceptButtonVisible] = useState(
    getIsAcceptButtonVisible(orderDate)
  )
  const timer = useRef()
  const decision = !isAcceptButtonVisible
    ? acceptanceTime
    : remainingTime > 0
    ? remainingTime
    : 0
  if (decision === acceptanceTime) {
    remainingTime = 0
  }
  useEffect(() => {
    let isSubscribed = true
    ;(() => {
      timer.current = setInterval(() => {
        const isAcceptButtonVisible = !moment().isBefore(orderDate)
        isSubscribed && setIsAcceptButtonVisible(isAcceptButtonVisible)
        if (isAcceptButtonVisible) {
          timer.current && clearInterval(timer.current)
        }
      }, 10000)
    })()
    return () => {
      timer.current && clearInterval(timer.current)
      isSubscribed = false
    }
  }, [])

  useSubscription(
    gql`
      ${subscriptionOrder}
    `,
    { variables: { id: _id } }
  )

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor:
            activeBar === 0
              ? colors.white
              : activeBar === 1
              ? colors.white
              : colors.darkgreen
        }
      ]}
      onPress={() => {
        navigation.navigate('OrderDetail', {
          activeBar,
          orderData: props?.order,
          remainingTime,
          createdAt,
          MAX_TIME,
          acceptanceTime,
          preparationTime
        })
      }}>
      {activeBar === 0 ? (
        <Badge
          status="success"
          containerStyle={{ position: 'absolute', top: 0, right: 0 }}
          badgeStyle={{
            backgroundColor: colors.rounded,
            width: 10,
            height: 10,
            borderRadius: 10
          }}
        />
      ) : null}

      <View style={styles.itemRowBar}>
        <TextDefault style={styles.heading} H5 bolder>
          {t('orderId')}:
        </TextDefault>
        <TextDefault style={styles.text} H5 bolder>
          {orderId}
        </TextDefault>

      </View>
      <View View style={styles.itemRowBar}>
        <TextDefault style={styles.heading}>{t('orderType')}:</TextDefault>
        <TextDefault style={styles.text}>
          {props?.order.isPickedUp ? t('pickUp') : t('delivery')}
        </TextDefault>
      </View>
      <View style={styles.itemRowBar}>
        <TextDefault style={styles.heading}>{t('orderAmount')}:</TextDefault>
        <TextDefault style={styles.text}>
          {`${configuration.currencySymbol}${orderAmount}`}:
        </TextDefault>
      </View>
      <View style={styles.itemRowBar}>
        <TextDefault style={styles.heading}>{t('paymentMethod')}</TextDefault>
        <TextDefault style={styles.text}>{paymentMethod}</TextDefault>
      </View>
      <View style={styles.itemRowBar}>
        <TextDefault style={styles.heading}>{t('time')}:</TextDefault>
        <TextDefault style={styles.text}>
          {moment(date).format('lll')}
        </TextDefault>
      </View>
      <View
        style={{
          borderBottomColor: colors.fontSecondColor,
          borderBottomWidth: 1
        }}
      />
      <View style={styles.timerBar}>
        {activeBar === 0 && (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flexBasis: '50%'
            }}>
            <CountDown
              until={decision}
              size={20}
              timeToShow={['H', 'M', 'S']}
              digitStyle={{ backgroundColor: colors.white }}
              digitTxtStyle={{
                color: isOvertime ? colors.orderUncomplete : colors.black,
                fontSize: 20
              }}
              timeLabels={{ h: null, m: null, s: null }}
              showSeparator={true}
              separatorStyle={{
                color: isOvertime ? colors.orderUncomplete : colors.black,
                marginTop: -5
              }}
              onFinish={() => setIsOvertime(true)}
            />
          </View>
        )}
        {activeBar === 1 && props?.order?.orderStatus === "PENDING" && (
          <View>
            <CountDown
              until={totalPrep}
              size={15}
              timeToShow={['H', 'M', 'S']}
              digitStyle={{ backgroundColor: colors.white }}
              digitTxtStyle={{
                color: isOvertime ? colors.orderUncomplete : colors.black,
                fontSize: 20
              }}
              timeLabels={{ h: null, m: null, s: null }}
              showSeparator={true}
              separatorStyle={{
                color: isOvertime ? colors.orderUncomplete : colors.black,
                marginTop: -5
              }}
              onFinish={() => setIsOvertime(true)}
            />
          </View>
        )}
        <View>
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor:
                  activeBar === 0
                    ? 'black'
                    : activeBar === 1
                    ? colors.green
                    : colors.white
              }
            ]}
            onPress={() =>
              navigation.navigate('OrderDetail', {
                activeBar,
                orderData: props?.order,
                remainingTime,
                createdAt,
                MAX_TIME,
                acceptanceTime,
                preparationTime,
                isRinged
              })
            }>
            <TextDefault
              bold
              style={{
                color:
                  activeBar === 0
                    ? colors.green
                    : activeBar === 1
                    ? props?.order?.orderStatus !== 'PICKED'
                      ? colors.orderUncomplete
                      : 'black'
                    : 'black'
              }}>
              {activeBar === 0
                ? t('pending')
                : activeBar === 1
                ? props.order.orderStatus === 'PENDING'
                  ? t('pending') // If it's pending, show "pending"
                  : props.order.orderStatus === 'ACCEPTED'
                  ? t('accepted') // Show accepted status if order is accepted
                  : props.order.orderStatus === 'ASSIGNED'
                  ? t('assigned') // Show assigned status if order is assigned
                  : props.order.orderStatus === 'PICKED'
                  ? t('deliveredToRider') // Show delivered to rider if it's picked
                  : t('delivered') // Default to delivered if none of the above
                : t('delivered')}
            </TextDefault>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}
export default HomeOrderDetails
