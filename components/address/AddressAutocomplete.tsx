/**
 * Sugestoes de morada agarradas a um campo existente.
 *
 * A primeira versao era uma caixa de pesquisa separada por cima do formulario
 * -- ou seja, dois sitios onde escrever a rua. O dono do produto cortou-a: e
 * o proprio campo "Nome da rua" que sugere enquanto se escreve, e escolher
 * uma sugestao preenche o resto da morada.
 *
 * Usa o endpoint que ja existia no backend (POST /common/places/autocomplete),
 * que devolve rua, numero, cidade e codigo postal por sugestao -- nao ha
 * chamada ao Google a partir da app nem chave no cliente.
 */
import { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
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

/**
 * Liga as sugestoes ao texto de um campo. O campo continua a ser de quem
 * chama; daqui vem so o estado (resultados, a procurar, falhou, vazio).
 * `dismiss()` cala as sugestoes ate o texto voltar a mudar — para o momento
 * em que uma sugestao e escolhida e o texto muda por causa disso.
 */
export const useAddressSuggestions = (query: string) => {
  const { api } = useApi();
  const [results, setResults] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Descarta respostas de pesquisas antigas que cheguem depois de uma mais
  // recente — senão a lista pisca com resultados do que já foi apagado.
  const latest = useRef(0);
  const lastQuery = useRef(query);

  // Texto mudou pela mão do técnico → volta a sugerir.
  if (query !== lastQuery.current) {
    lastQuery.current = query;
    if (dismissed) setDismissed(false);
  }

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (dismissed || query.trim().length < MIN_CHARS) {
      setResults([]);
      setSearching(false);
      setFailed(false);
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

  const dismiss = () => {
    setDismissed(true);
    setResults([]);
  };

  const showEmpty =
    !searching && !dismissed && !failed && results.length === 0 && query.trim().length >= MIN_CHARS;

  return { results, searching, failed, showEmpty, dismiss };
};

/** A lista que aparece por baixo do campo enquanto ha sugestoes. */
export const AddressSuggestionList = ({
  results,
  failed,
  showEmpty,
  onSelect,
}: {
  results: AddressSuggestion[];
  failed: boolean;
  showEmpty: boolean;
  onSelect: (s: AddressSuggestion) => void;
}) => {
  const { t } = useTranslation();

  return (
    <View>
      {results.length > 0 && (
        <View
          className="rounded-2xl border mt-2 overflow-hidden"
          style={{ borderColor: Colors.line, backgroundColor: Colors.card }}
        >
          {results.slice(0, 5).map((item, index) => (
            <TouchableOpacity
              key={item.place_id ?? index}
              onPress={() => onSelect(item)}
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
