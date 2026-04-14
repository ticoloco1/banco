/**
 * Categorias de profissão para o diretório e mini sites.
 * "Corretor de imóveis" e "Venda de domínios" ficam separados.
 */

export const PROFESSION_CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "corretor_imoveis", label: "Corretor de imóveis" },
  { value: "venda_dominios", label: "Venda de domínios" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "finanças", label: "Finanças" },
  { value: "saúde", label: "Saúde" },
  { value: "educação", label: "Educação" },
  { value: "arte", label: "Arte" },
  { value: "música", label: "Música" },
  { value: "esportes", label: "Esportes" },
  { value: "moda", label: "Moda" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "imóveis", label: "Imóveis (outros)" },
  { value: "outros", label: "Outros" },
] as const;

/** Valores para filtro no diretório (inclui "todos") */
export const DIRECTORY_FILTER_CATEGORIES = [
  "todos",
  ...PROFESSION_CATEGORIES.map((p) => p.value),
];

export function getProfessionLabel(value: string): string {
  return PROFESSION_CATEGORIES.find((p) => p.value === value)?.label ?? value;
}
