import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from "@/constants/Colors";

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routesWithAbsolutePosition = ['home/index', 'wallet/index'];
  const routesWithRoundedTop = ['home/index', 'wallet/index', 'history/index'];

  const getCurrentTab = () => {
    return state.routes[state.index].name;
  };

  const isAbsolute = () => {
    return routesWithAbsolutePosition.includes(getCurrentTab());
  }

  const isRoundedTop = () => {
    return routesWithRoundedTop.includes(getCurrentTab());
  }

  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          height: 64 + bottomInset,
          paddingBottom: bottomInset,
        },
        isRoundedTop() && styles.roundedTop,
        isAbsolute() && styles.absolute,
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;
        const icon = options.tabBarIcon;
        const tabBarTestID = (options as { tabBarTestID?: string }).tabBarTestID;

        const isFocused = state.index === index;

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
    backgroundColor: Colors.primary,
    paddingTop: 12,
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
