import ArrowIcon from "@/assets/icons/arrow"
import { CustomText } from "@/components/CustomText"
import CustomTouchableOpacity from "@/components/CustomTouchableOpacity"
import { Colors } from "@/constants/Colors"
import React from 'react'
import { Image, View } from "react-native";
const activity = [
  {
    user: {
      name: 'Jhonny Rivers',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-01T12:00:00Z',
    price: 37000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Alice Johnson',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-02T14:00:00Z',
    price: 45000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Bob Smith',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-03T16:00:00Z',
    price: 52000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Charlie Brown',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-04T18:00:00Z',
    price: 61000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Diana Prince',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-05T20:00:00Z',
    price: 72000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Eve Adams',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-06T22:00:00Z',
    price: 83000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Frank Castle',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-07T10:00:00Z',
    price: 94000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Grace Hopper',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-08T12:00:00Z',
    price: 105000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Hank Pym',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-09T14:00:00Z',
    price: 116000,
    currency: 'USD',
    status: 'completed',
  },
  {
    user: {
      name: 'Ivy League',
      avatar: {
        src: 'https://r2.erweima.ai/imgcompressed/img/compressed_c5b0073e2f4244f269ef19b63b36acaa.webp',
        alt: 'User Avatar',
      },
    },
    datetime: '2021-09-10T16:00:00Z',
    price: 127000,
    currency: 'USD',
    status: 'completed',
  }
]

const Activity = () => {
  const renderMoney = (price: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    })

    return formatter.format(price / 100)
  }

  const renderDate = (datetime: string) => {
    const date = new Date(datetime)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }) + ' | ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    })
  }

  return (
    <View className="bg-primary rounded-t-xl p-6 pb-24">
      <CustomText boldness="semiBold" color="secondary" size="large">
        Activity
      </CustomText>

      <View className="py-2 space-y-4">
        {activity.map((item, index) => {
          const { user, datetime, price, currency, status } = item

          return (
            <View key={index} className="space-y-4">
              <CustomTouchableOpacity key={index} classes="p-0" type="transparent">
                <View className="flex-row justify-between items-center space-x-4">
                  <View className="h-10 w-10 rounded-full overflow-hidden">
                    <Image
                      src={user.avatar.src}
                      source={{ uri: user.avatar.src }}
                      alt={user.avatar.alt}
                      className="w-full h-full object-cover object-center"
                    />
                  </View>
                  <View className="flex-1">
                    <CustomText size="small" color="secondary" boldness="bold" numberOfLines={1}>
                      {user.name}
                    </CustomText>
                    <CustomText size="extraSmall" color="gray_medium" boldness="semiBold" numberOfLines={1}>
                      {renderDate(datetime)}
                    </CustomText>
                  </View>
                  <View>
                    <CustomText size="large" color="secondary" boldness="medium" numberOfLines={1}>
                      {renderMoney(price, currency)}
                    </CustomText>
                  </View>
                  <View className="w-3 h-3">
                    <ArrowIcon color={Colors.gray_strong} position="right" />
                  </View>
                </View>
              </CustomTouchableOpacity>
              <View className="h-[1px] w-full bg-gray_light"></View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default Activity