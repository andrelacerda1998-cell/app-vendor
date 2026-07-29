/**
 * Pesquisa de morada com sugestoes.
 *
 * Escrever cinco campos a mao num telemovel, muitas vezes na rua, era o que
 * mais travava este passo -- e o que mais erros de morada gerava nas faturas.
 * Aqui escreve-se a rua e escolhe-se da lista; os campos ficam preenchidos.
 *
 * Usa o endpoint que ja existia no backend (POST /common/places/autocomplete),
 * que devolve rua, numero, cidade e codigo postal por sugestao -- nao ha
 * chamada ao Google a partir da app nem chave no cliente.
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CustomText } from '@/components/CustomText';
import { Colors } from '@/constants/Colors';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { useApi } from '@/contexts/ApiContext';

export type AddressSuggestion = {
  place_id: string | null;
  description: string | null;
  street_name: string | null;
  street_number: string | null;
  city: string | null;
  postal_code: string | null;
};

/** Abaixo disto o Google devolve ruido; poupa chamadas e evita listas inuteis. */
const MIN_CHARS = 4;
/** O tecnico escreve a correr: so procuramos quando para de escrever. */
const DEBOUNCE_MS = 400;

const AddressAutocomplete = ({
  onSelect,
  initialQuery = '',
}: {
  onSelect: (suggestion: AddressSuggestion) => void;
  initialQuery?: string;
}) => {
  const { t } = useTranslation();
  const { api } = useApi();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Descarta respostas de pesquisas antigas que cheguem depois de uma mais
  // recente — senão a lista pisca com resultados do que já foi apagado.
  const latest = useRef(0);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (dismissed || query.trim().length < MIN_CHARS) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    setFailed(false);
    timer.current = setTimeout(() => {
      const ticket = ++latest.current;
      api.post(API_ROUTES.PLACES_AUTOCOMPLETE, { input: query.trim() })
        .then((response: any) => {
          if (ticket !== latest.current) return;
          setResults(response?.data?.data?.predictions ?? []);
        })
        .catch(() => {
          if (ticket !== latest.current) return;
          // Falhar a pesquisa não pode bloquear o passo: os campos continuam
          // editáveis à mão, e dizemos isso em vez de ficar em silêncio.
          setResults([]);
          setFailed(true);
        })
        .finally(() => {
          if (ticket === latest.current) setSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, dismissed]);

  const showEmpty =
    !searching && !dismissed && !failed && results.length === 0 && query.trim().length >= MIN_CHARS;

  const choose = (item: AddressSuggestion) => {
    setQuery(item.description ?? '');
    setDismissed(true);
    setResults([]);
    onSelect(item);
  };

  return (
    <View>
      <View
        className="flex-row items-center rounded-2xl bg-card border px-4"
        style={{ borderColor: Colors.line, height: 56 }}
      >
        <Feather name="search" size={20} color={Colors.muted} />
        <TextInput
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setDismissed(false);
          }}
          autoCorrect={false}
          placeholder={t('address.search_placeholder')}
          placeholderTextColor={Colors.muted}
          accessibilityLabel={t('address.search_label')}
          className="flex-1 ml-3"
          style={{ color: Colors.secondary, fontFamily: 'Poppins_500Medium', fontSize: 16 }}
        />
        {searching && <ActivityIndicator size="small" color={Colors.brand} />}
        {!searching && query.length > 0 && (
          <TouchableOpacity
            onPress={() => { setQuery(''); setResults([]); setDismissed(true); }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('general.clear')}
          >
            <Feather name="x" size={18} color={Colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {results.length > 0 && (
        <View
          className="rounded-2xl border mt-2 overflow-hidden"
          style={{ borderColor: Colors.line, backgroundColor: Colors.card }}
        >
          {results.slice(0, 5).map((item, index) => (
            <TouchableOpacity
              key={item.place_id ?? index}
              onPress={() => choose(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              className="flex-row items-center px-4"
              style={{
                minHeight: 52,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: Colors.line,
              }}
            >
              <Feather name="map-pin" size={16} color={Colors.muted} />
              <CustomText color="secondary" size="small" classes="flex-1 ml-3" numberOfLines={2}>
                {item.description ?? ''}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sem isto, uma pesquisa sem resultados nao dava sinal nenhum: o tecnico
          escrevia a morada toda e o ecra ficava calado, sem saber se estava a
          carregar, se tinha falhado, ou se devia escrever nos campos em baixo. */}
      {(failed || showEmpty) && (
        <CustomText color="muted" size="small" classes="mt-2" numberOfLines={2}>
          {failed ? t('address.search_failed') : t('address.search_empty')}
        </CustomText>
      )}
    </View>
  );
};

export default AddressAutocomplete;
