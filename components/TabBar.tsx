import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from "@/constants/Colors";
import { CustomText } from "@/components/CustomText";

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const routesWithAbsolutePosition = ['home/index', 'wallet/index'];
  const routesWithRoundedTop = ['home/index', 'wallet/index', 'history/index'];

  const labelMap: Record<string, string> = {
    'home/index': t('tabs.home'),
    'wallet/index': t('tabs.agenda'),
    'history/index': t('tabs.earnings'),
    'profile': t('tabs.profile'),
  };

  const getCurrentTab = () => state.routes[state.index].name;
  const isAbsolute = () => routesWithAbsolutePosition.includes(getCurrentTab());
  const isRoundedTop = () => routesWithRoundedTop.includes(getCurrentTab());
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          height: 72 + bottomInset,
          paddingBottom: bottomInset,
        },
        isRoundedTop() && styles.roundedTop,
        isAbsolute() && styles.absolute,
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const icon = options.tabBarIcon;
        const tabBarTestID = (options as { tabBarTestID?: string }).tabBarTestID;
        const isFocused = state.index === index;
        const labelText = labelMap[route.name] ?? (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            key={route.key}
          >
            {icon ? icon({ color: isFocused ? Colors.support_primary : Colors.gray_strong, focused: isFocused, size: 24 }) : null}
            <CustomText
              size="extraSmall"
              color={isFocused ? "support_primary" : "gray_medium"}
              boldness={isFocused ? "semiBold" : "regular"}
              classes="mt-1"
              numberOfLines={1}
            >
              {labelText}
            </CustomText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: 10,
  },
  roundedTop: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  absolute: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
