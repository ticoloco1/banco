/**
 * Metadados ERC721 compatíveis com OpenSea / Rarible.
 * @see https://docs.opensea.io/docs/metadata-standards
 */
export type OpenSeaAttribute = {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
};

export type OpenSeaCompatibleMetadata = {
  name: string;
  description?: string;
  image: string;
  /** Vídeo / conteúdo animado (OpenSea). */
  animation_url?: string;
  external_url?: string;
  attributes: OpenSeaAttribute[];
};

export function buildOpenSeaMetadataJson(m: OpenSeaCompatibleMetadata): string {
  const obj: Record<string, unknown> = {
    name: m.name,
    image: m.image,
    attributes: m.attributes,
  };
  if (m.description) obj.description = m.description;
  if (m.animation_url) obj.animation_url = m.animation_url;
  if (m.external_url) obj.external_url = m.external_url;
  return JSON.stringify(obj);
}
