import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomText } from '@/components/CustomText';
import CustomTouchableOpacity from '@/components/CustomTouchableOpacity';
import TouchOpacity from '@/components/TouchOpacity';
import UserAvatarIcon from '@/assets/icons/user-avatar';
import { Colors } from '@/constants/Colors';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useApi } from '@/contexts/ApiContext';

/**
 * Avaliar o cliente, em diálogo centrado.
 *
 * Era um bottom sheet, que o faz subir do fundo e encosta o conteúdo à beira do
 * ecrã. Aqui o que se pede é uma coisa só e curta -- cinco estrelas -- e um
 * diálogo centrado diz isso melhor: aparece onde o olho já está, e não obriga a
 * descer o polegar até ao rodapé.
 *
 * NÃO AVALIAR É UMA OPÇÃO VISÍVEL, e não um gesto que ele tem de adivinhar. O
 * serviço já está concluído: prendê-lo a uma nota que interessa à Piquet, e não
 * a ele, era cobrar-lhe o trabalho duas vezes. "Agora não" fecha e segue.
 */
const RateCustomerContent = ({
  serviceId,
  customerName,
  onDone,
  onError,
}: {
  serviceId: string | number;
  customerName?: string | null;
  /** Fecha o diálogo. Corre tanto no envio como no "agora não". */
  onDone: () => void;
  onError: () => void;
}) => {
  const { t } = useTranslation();
  const { api } = useApi();

  const [rate, setRate] = useState(0);
  const [comentario, setComentario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (!rate || submitting) return;
    setSubmitting(true);

    const texto = comentario.trim();

    api.put(API_ROUTES.PUT_RATE_SERVICE(String(serviceId)), {
      rate,
      // Vazio vai como `undefined` e não como "": o servidor aceita
      // `nullable`, mas gravar uma string vazia faz o histórico mostrar um
      // comentário em branco por baixo das estrelas.
      ...(texto ? { comment: texto } : {}),
    })
      .then(() => onDone())
      .catch(() => onError())
      .finally(() => setSubmitting(false));
  };

  return (
    <View className="w-full items-center px-7 py-8">
      {/* O `UserAvatarIcon` é um SVG sem dimensão própria: solto, estica até
          encher o que o contiver -- ocupava o diálogo inteiro. A caixa de 56 px
          é o que o limita, tal como no ecrã antigo. */}
      <View className="h-14 w-14 rounded-full overflow-hidden">
        <UserAvatarIcon />
      </View>

      {!!customerName && (
        <CustomText size="title" color="secondary" boldness="bolder" classes="text-center mt-4" numberOfLines={2}>
          {customerName}
        </CustomText>
      )}

      <CustomText size="small" color="muted" classes="text-center mt-1.5" numberOfLines={2}>
        {t('services.service.rate.subtitle', {
          defaultValue: 'Avalia a tua experiência com este cliente',
        })}
      </CustomText>

      {/* As estrelas centradas e com espaço entre si: são o único alvo de
          toque deste ecrã e estavam coladas umas às outras. */}
      <View className="flex-row items-center justify-center mt-6" style={{ gap: 10 }}>
        {[1, 2, 3, 4, 5].map((valor) => (
          <TouchOpacity
            key={valor}
            onPress={() => setRate(valor)}
            accessibilityRole="button"
            accessibilityLabel={String(valor)}
            accessibilityState={{ selected: rate >= valor }}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            {/* Sempre `star`: a estrela vazada (`staro`) não existe nesta
                versão do pacote, e o ecrã antigo já distinguia só pela cor. */}
            <AntDesign
              name="star"
              size={38}
              /* `gray_medium` e não `card_high`: a segunda é praticamente a
                 cor do fundo do diálogo, e as estrelas por escolher ficavam
                 invisíveis -- o ecrã parecia não ter onde tocar. */
              color={rate >= valor ? Colors.brand : Colors.gray_medium}
            />
          </TouchOpacity>
        ))}
      </View>

      {/* A OBSERVAÇÃO só aparece depois de escolher a estrela.
          Antes da nota não há o que comentar, e um campo de texto aberto de
          início transforma uma pergunta de um toque num formulário -- que é
          precisamente o que faz as pessoas fecharem sem responder. */}
      {rate > 0 && (
        <View className="w-full mt-5">
          {/* Etiqueta: um campo sem nome, dentro de um diálogo, lê-se como
              decoração. */}
          <CustomText size="extraSmall" color="muted" boldness="bold" classes="mb-1.5">
            {t('services.service.rate.comment_label', { defaultValue: 'OBSERVAÇÕES' })}
          </CustomText>
          <TextInput
            value={comentario}
            onChangeText={setComentario}
            placeholder={t('services.service.rate.comment_placeholder', {
              defaultValue: 'Queres acrescentar alguma coisa? (opcional)',
            })}
            placeholderTextColor={Colors.muted}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            className="rounded-2xl px-4 py-3"
            /**
             * CONTRASTE A SÉRIO. O campo tinha o fundo do cartão (`card_high`)
             * e um contorno de `line`: dentro de um diálogo que já é escuro,
             * desaparecia -- parecia um espaço vazio e não um sítio onde
             * escrever. Fundo mais escuro do que o diálogo (não mais claro) e
             * contorno âmbar esbatido, que é como a app marca o que está
             * activo.
             */
            style={{
              backgroundColor: Colors.primary,
              borderWidth: 1.5,
              borderColor: `${Colors.brand}55`,
              color: Colors.secondary,
              minHeight: 92,
              fontFamily: 'Poppins_400Regular',
              fontSize: 14,
            }}
            accessibilityLabel={t('services.service.rate.comment_placeholder', {
              defaultValue: 'Queres acrescentar alguma coisa? (opcional)',
            })}
          />
        </View>
      )}

      <CustomTouchableOpacity
        size="large"
        type="support_primary"
        textColor="primary"
        textBoldness="bolder"
        text={t('services.service.rate.submit', { defaultValue: 'Enviar' })}
        onPress={submit}
        /* Sem estrela escolhida não há nada para enviar: o botão desligado
           evita um pedido que o servidor recusaria por `rate` inválido. */
        disabled={!rate || submitting}
        classes="mt-7 w-full"
      />

      {/* "Agora não" a VERMELHO e com contorno.
          Era texto cinzento solto -- lia-se como uma legenda, não como uma
          saída, e quem não quisesse avaliar não via por onde sair. Vermelho
          porque é a cor que esta app usa para recusar (o "Recusar" do cartão
          de pedido é igual), não porque seja um perigo. */}
      <TouchOpacity
        onPress={onDone}
        rounded="lg"
        itemsCenter
        otherClasses="w-full mt-3 py-3.5 border"
        style={{ borderColor: Colors.danger, borderWidth: 1 }}
        accessibilityRole="button"
        hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
      >
        <CustomText size="medium" color="danger" boldness="bold" classes="text-center">
          {t('services.service.rate.skip', { defaultValue: 'Agora não' })}
        </CustomText>
      </TouchOpacity>
    </View>
  );
};

export default RateCustomerContent;
