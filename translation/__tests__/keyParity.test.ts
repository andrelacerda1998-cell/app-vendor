/**
 * Paridade de chaves entre pt_PT e en_US.
 *
 * As duas árvores de tradução são mantidas à mão; uma chave que exista só num
 * dos lados rebenta em runtime (texto em falta ou a chave crua no ecrã) sem
 * nada o apanhar. Este teste torna a paridade um requisito do CI — substitui o
 * script manual que era corrido caso a caso.
 */
import ptPT from '@/translation/resources/pt_PT';
import enUS from '@/translation/resources/en_US';

/** Achata a árvore em caminhos "a.b.c", normalizando plurais (_one/_other). */
const flatten = (obj: Record<string, any>, prefix = ''): string[] => {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flatten(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
};

describe('paridade i18n pt_PT ↔ en_US', () => {
  const pt = new Set(flatten(ptPT as Record<string, any>));
  const en = new Set(flatten(enUS as Record<string, any>));

  it('todas as chaves de pt_PT existem em en_US', () => {
    const missing = [...pt].filter((k) => !en.has(k));
    expect(missing).toEqual([]);
  });

  it('todas as chaves de en_US existem em pt_PT', () => {
    const missing = [...en].filter((k) => !pt.has(k));
    expect(missing).toEqual([]);
  });
});
