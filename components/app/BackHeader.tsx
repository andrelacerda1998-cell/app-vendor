import { router } from 'expo-router';
import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/Colors';
import ArrowIcon from "@/assets/icons/arrow";

/**
 * Cabeçalho com botão de voltar, usado em 35 ecrãs.
 *
 * O botão tinha 20×20 de área útil, sem `hitSlop`, sem retorno visual ao toque
 * e sem nome para leitores de ecrã — e é o controlo mais usado da app, muitas
 * vezes com o telemóvel numa mão e uma ferramenta na outra.
 */
const BackHeader = ({
  backgroundColor,
  backButtonColor,
  middleItem=undefined,
  rigthItem=undefined,
  onBack,
  otherClasses,
  ...props
}: {
  backgroundColor?: keyof typeof Colors,
  backButtonColor: keyof typeof Colors,
  middleItem?: (() => React.JSX.Element) | undefined,
  rigthItem?: (() => React.JSX.Element) | undefined,
  onBack?: () => void,
  otherClasses?: string,
}) => {
  const { t } = useTranslation();

  const goBack = () => {
    if (onBack) {
      return onBack();
    }
    if (router.canGoBack()) {
      return router.back();
    }
    // A rota antiga aqui era "/(app)/home", que não existe — sempre que o
    // histórico estava vazio, o botão não fazia nada.
    return router.replace("/(app)/(tabs)/home");
  };

  return (
    <View className={`flex-row items-center ${otherClasses}`} {...props}>
      <TouchableOpacity
        onPress={goBack}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={t('general.back')}
        // 44×44 é o mínimo recomendado; o hitSlop dá folga extra sem empurrar o
        // resto do cabeçalho.
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="items-start justify-center"
        style={{ width: 44, height: 44, marginLeft: -6 }}
      >
        <View className="w-5 h-5">
          <ArrowIcon color={Colors[backButtonColor]} position="left" />
        </View>
      </TouchableOpacity>
      <View className="flex-1 items-center">
        {middleItem && middleItem()}
      </View>
      <View className="w-10">
        {rigthItem && rigthItem()}
      </View>
    </View>
  )
}

export default BackHeader;
