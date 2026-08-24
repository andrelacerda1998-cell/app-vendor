/**
 * Onde obter cada documento.
 *
 * "Certificado de registo criminal (válido 90 dias)" nao ajuda quem nunca
 * pediu um: o passo dizia o QUE era preciso e nunca ONDE se arranja. Quem nao
 * sabia, saía da app para procurar -- e muitos nao voltavam.
 *
 * A tabela `documents` do backend so tem id e nome traduzido (nao ha slug nem
 * coluna de ajuda), por isso a correspondencia e feita por palavras-chave do
 * nome. Emparelhar por id seria mais fragil: os ids podem nao coincidir entre
 * ambientes. Se um dia se acrescentar um `help_url` a essa tabela, isto passa
 * a vir do servidor e este ficheiro desaparece.
 */

export type DocumentHelp = {
  /** Chave i18n do rotulo do link. */
  labelKey: string;
  url: string;
};

const HELP: { match: RegExp; help: DocumentHelp }[] = [
  {
    // Certificado do Registo Criminal — pede-se online no portal da Justiça.
    match: /registo\s*criminal|criminal\s*record/i,
    help: {
      labelKey: 'complete_profile.documents.help.criminal_record',
      url: 'https://registocriminal.justica.gov.pt/',
    },
  },
  {
    // Declaração de Início de Atividade — Portal das Finanças.
    match: /in[ií]cio\s*de\s*atividade|start\s*of\s*activity/i,
    help: {
      labelKey: 'complete_profile.documents.help.activity_declaration',
      url: 'https://www.portaldasfinancas.gov.pt',
    },
  },
];

/**
 * O Cartao de Cidadao nao entra de proposito: e um documento que o tecnico ja
 * tem na carteira, e mandar-lhe um link para o renovar era ruido.
 */
export const helpForDocument = (name?: string | null): DocumentHelp | null => {
  if (!name) return null;
  return HELP.find(({ match }) => match.test(name))?.help ?? null;
};
