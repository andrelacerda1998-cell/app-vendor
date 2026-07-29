/**
 * Primitivas visuais partilhadas (linguagem build-12).
 * Manter TODOS os ecrãs a usar estas peças para o aspeto ser consistente.
 */
import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleProp, Animated, Easing, DimensionValue, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';

/** Sombra subtil comum aos cartões — dá profundidade sem "sujar" o fundo. */
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 4,
};

/**
 * Cartão base.
 *
 * O fundo é um gradiente muito subtil (card_high → card, de cima para baixo) em
 * vez de cinzento chapado: num tema quase preto, a luz a cair de cima é o que
 * separa um cartão do fundo sem precisar de mais cor nem de sombras pesadas.
 * A borda de topo é ligeiramente mais clara que a das laterais, pelo mesmo motivo.
 */
export const Card = ({
  children,
  style,
  className = '',
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  padded?: boolean;
}) => (
  // O gradiente vai ATRÁS, em posição absoluta, e não como contentor: assim o
  // `className` que os ecrãs passam (flex-row, items-center…) continua a aplicar-se
  // ao elemento que envolve os filhos, como sempre se aplicou.
  <View
    className={`rounded-2xl border overflow-hidden ${padded ? 'p-4' : ''} ${className}`}
    style={[{ borderColor: Colors.line, borderTopColor: 'rgba(255,255,255,0.09)' }, cardShadow, style]}
  >
    <LinearGradient
      colors={[Colors.card_high, Colors.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
    {children}
  </View>
);

/** Cabeçalho de secção: pequeno, espaçado e discreto. */
export const SectionHeader = ({
  title,
  action,
  onAction,
  classes = '',
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  classes?: string;
}) => (
  <View className={`flex-row items-center justify-between mb-3 ${classes}`}>
    <CustomText size="medium" color="secondary" boldness="bolder">
      {title}
    </CustomText>
    {!!action && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <CustomText size="extraSmall" color="brand" boldness="bold">
          {action}
        </CustomText>
      </TouchableOpacity>
    )}
  </View>
);

/** Destaque âmbar com gradiente (substitui os washes lisos que ficavam baços). */
export const HeroCard = ({
  children,
  style,
  className = '',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) => (
  <LinearGradient
    colors={['rgba(250,187,91,0.22)', 'rgba(250,187,91,0.06)']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[
      { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(250,187,91,0.28)' },
      cardShadow,
      style,
    ]}
  >
    <View className={`p-5 ${className}`}>{children}</View>
  </LinearGradient>
);

/** Ícone dentro de um quadrado tingido — usado em listas e cabeçalhos. */
export const IconTile = ({
  children,
  size = 40,
  tint = 'rgba(250,187,91,0.14)',
}: {
  children: React.ReactNode;
  size?: number;
  tint?: string;
}) => (
  <View
    className="items-center justify-center rounded-xl"
    style={{ width: size, height: size, backgroundColor: tint }}
  >
    {children}
  </View>
);

/** Estado vazio elegante: ícone em círculo + título + subtítulo. */
export const EmptyState = ({
  icon = 'inbox',
  title,
  subtitle,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
}) => (
  <Card className="items-center py-8">
    <View
      className="items-center justify-center rounded-full mb-3"
      style={{ width: 56, height: 56, backgroundColor: Colors.card_high }}
    >
      <Feather name={icon} size={24} color={Colors.muted} />
    </View>
    <CustomText color="secondary" boldness="semiBold" size="medium" classes="text-center">
      {title}
    </CustomText>
    {!!subtitle && (
      <CustomText color="muted" size="small" classes="text-center mt-1" numberOfLines={3}>
        {subtitle}
      </CustomText>
    )}
  </Card>
);

/**
 * Pulsação partilhada pelos esqueletos.
 *
 * Um único valor animado por bloco, em opacidade e com `useNativeDriver`, para
 * o "a carregar" se ler de relance sem custar frames.
 */
const useSkeletonPulse = () => {
  const opacity = React.useRef(new Animated.Value(0.45)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
};

/**
 * Bloco cinzento a pulsar — a peça base de qualquer esqueleto.
 * Usar SEMPRE em vez de mostrar zeros/listas vazias enquanto se carrega:
 * um `0,00 €` durante o carregamento lê-se como um valor real.
 */
export const SkeletonBlock = ({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const opacity = useSkeletonPulse();
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: Colors.card_high, opacity },
        style,
      ]}
    />
  );
};

/**
 * Esqueleto de lista: N cartões com ícone + duas linhas de texto.
 * Espelha o aspeto real das listas da app (Movimentos, Histórico, Agenda…).
 */
export const SkeletonList = ({
  rows = 4,
  showIcon = true,
}: {
  rows?: number;
  showIcon?: boolean;
}) => (
  <View style={{ gap: 10 }}>
    {Array.from({ length: rows }, (_, i) => (
      <Card key={i} className="flex-row items-center">
        {showIcon && <SkeletonBlock width={40} height={40} radius={12} />}
        <View className={`flex-1 ${showIcon ? 'ml-3' : ''}`}>
          <SkeletonBlock width="55%" height={14} />
          <SkeletonBlock width="35%" height={11} style={{ marginTop: 8 }} />
        </View>
      </Card>
    ))}
  </View>
);

/**
 * Estado de erro COM saída: diz o que falhou, o que fazer, e dá um botão.
 *
 * Regra da app: uma chamada que falha nunca pode parecer "não tens nada".
 * Sempre que um ecrã apanha um erro de rede, mostra isto — nunca um EmptyState.
 */
export const ErrorState = ({
  icon = 'wifi-off',
  title,
  subtitle,
  onRetry,
  retryLabel,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  onRetry?: () => void;
  /** Por omissão usa `general.try_again`; passar só para casos especiais. */
  retryLabel?: string;
}) => {
  const { t } = useTranslation();
  return (
    <Card className="items-center py-8">
      <View
        className="items-center justify-center rounded-full mb-3"
        style={{ width: 56, height: 56, backgroundColor: 'rgba(255,90,95,0.14)' }}
      >
        <Feather name={icon} size={24} color={Colors.danger} />
      </View>
      <CustomText color="secondary" boldness="semiBold" size="medium" classes="text-center">
        {title}
      </CustomText>
      {!!subtitle && (
        <CustomText color="muted" size="small" classes="text-center mt-1" numberOfLines={4}>
          {subtitle}
        </CustomText>
      )}
      {!!onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.85}
          className="rounded-xl px-5 py-3 mt-4"
          style={{ backgroundColor: Colors.brand }}
        >
          <CustomText color="on_brand" boldness="bold" size="small">
            {retryLabel ?? t('general.try_again')}
          </CustomText>
        </TouchableOpacity>
      )}
    </Card>
  );
};

/**
 * Lista agrupada: UM cartão com linhas separadas por hairline
 * (mais elegante do que N cartões iguais empilhados).
 */
export type ListRowItem = {
  key?: string;
  icon?: React.ReactNode;
  label: string;
  value?: string;
  valueColor?: 'muted' | 'brand' | 'danger' | 'success' | 'secondary';
  onPress?: () => void;
};

export const ListCard = ({ items }: { items: ListRowItem[] }) => (
  <Card padded={false}>
    {items.map((item, i) => (
      <View key={item.key ?? i}>
        {i > 0 && (
          <View style={{ height: 1, backgroundColor: Colors.line, marginLeft: item.icon ? 64 : 16 }} />
        )}
        <TouchableOpacity
          activeOpacity={item.onPress ? 0.7 : 1}
          onPress={item.onPress}
          disabled={!item.onPress}
          className="flex-row items-center px-4"
          style={{ minHeight: 58 }}
        >
          {!!item.icon && <View className="w-8 items-center mr-4">{item.icon}</View>}
          {/* Duas linhas: os rótulos costumam caber numa, mas conteúdo dinâmico
              (uma morada, por exemplo) cortava a meio. */}
          <CustomText color="secondary" size="medium" boldness="medium" classes="flex-1" numberOfLines={2}>
            {item.label}
          </CustomText>
          {!!item.value && (
            <CustomText
              size="small"
              color={item.valueColor ?? 'muted'}
              boldness={item.valueColor && item.valueColor !== 'muted' ? 'bold' : 'regular'}
              classes="mr-2"
              numberOfLines={1}
            >
              {item.value}
            </CustomText>
          )}
          {!!item.onPress && <Feather name="chevron-right" size={18} color={Colors.muted} />}
        </TouchableOpacity>
      </View>
    ))}
  </Card>
);
