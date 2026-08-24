import React from "react";
import { Image, Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { CustomText } from "@/components/CustomText";
import { Colors } from "@/constants/Colors";

export type CustomerPhoto = { id: number; url: string };

/**
 * Fotos que o CLIENTE juntou ao pedido, para o profissional ver o problema
 * antes de sair — a torneira que pinga, o quadro elétrico, o móvel por montar.
 *
 * Não confundir com as fotos de antes/depois, que são tiradas no local e servem
 * para o proteger numa reclamação. Estas vêm de fora e servem para ele decidir
 * se aceita e o que leva na carrinha.
 *
 * Miniaturas em linha, com toque para ver em grande: numa miniatura de 64 px
 * ninguém distingue uma fuga de uma mancha, e o objetivo do ecrã é precisamente
 * ele conseguir ver.
 *
 * Os URL são temporários (assinados, 60 min) — chega para ver o pedido, decidir
 * e ir a caminho. Se expirarem, a imagem falha e fica o espaço: preferível a
 * fingir que não havia foto nenhuma.
 */
const CustomerPhotos = ({
  photos,
  compact = false,
}: {
  photos?: CustomerPhoto[] | null;
  /** No cartão de pedido as miniaturas são menores e sem título repetido. */
  compact?: boolean;
}) => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  if (!Array.isArray(photos) || photos.length === 0) return null;

  const size = compact ? 56 : 72;

  return (
    <View className={compact ? "mt-3" : "mt-4"}>
      <View className="flex-row items-center">
        <Feather name="camera" size={16} color={Colors.brand} />
        <CustomText color="muted" size="extraSmall" boldness="bold" classes="ml-2">
          {t("services.customer_photos", { defaultValue: "Fotografias do cliente" }).toUpperCase()}
        </CustomText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2"
        contentContainerStyle={{ gap: 8 }}
      >
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={photo.id ?? photo.url}
            activeOpacity={0.8}
            onPress={() => setOpenIndex(index)}
            accessibilityRole="imagebutton"
            accessibilityLabel={t("services.customer_photo_open", {
              defaultValue: "Ver fotografia {{n}}",
              n: index + 1,
            })}
          >
            <Image
              source={{ uri: photo.url }}
              style={{ width: size, height: size, borderRadius: 12, backgroundColor: Colors.card_high }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={openIndex !== null}
        transparent
        animationType="fade"
        // Sem isto, no Android o botão físico de voltar fecha o ecrã inteiro
        // por baixo do visor em vez de fechar só a foto.
        onRequestClose={() => setOpenIndex(null)}
      >
        <Pressable
          onPress={() => setOpenIndex(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}
        >
          {openIndex !== null && (
            <Image
              source={{ uri: photos[openIndex].url }}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />
          )}

          {/* Botão explícito além do toque no fundo: quem não sabe que pode
              tocar fora fica preso num ecrã preto sem saída visível. */}
          <TouchableOpacity
            onPress={() => setOpenIndex(null)}
            accessibilityRole="button"
            accessibilityLabel={t("common.close", { defaultValue: "Fechar" })}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{
              position: "absolute",
              top: 56,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {photos.length > 1 && openIndex !== null && (
            <CustomText color="secondary" size="small" classes="absolute" style={{ bottom: 48, color: "#FFFFFF" }}>
              {`${openIndex + 1}/${photos.length}`}
            </CustomText>
          )}
        </Pressable>
      </Modal>
    </View>
  );
};

export default CustomerPhotos;
