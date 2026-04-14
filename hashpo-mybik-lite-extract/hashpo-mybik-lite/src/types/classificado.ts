/**
 * Schema de classificado – informações básicas, mídia, vendedor, item, NFT e monetização.
 */

export type TipoAnuncio = "venda" | "aluguel" | "servico" | "produto";

export type Localizacao = {
  pais?: string;
  estado?: string;
  cidade?: string;
};

/** Informações básicas (obrigatórias) */
export type ClassificadoBasico = {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  currency?: string;
  tipo_anuncio: TipoAnuncio;
  location?: Localizacao;
  data_publicacao?: string;
};

/** Mídia */
export type ClassificadoMidia = {
  images?: string[];
  video?: string;
  thumbnail?: string;
  tour_3d?: string;
};

/** Informações do vendedor */
export type ClassificadoVendedor = {
  seller_name?: string;
  seller_mini_site_slug?: string;
  seller_photo?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  seller_site?: string;
};

/** Imóveis */
export type ClassificadoImovel = {
  area?: number;
  quartos?: number;
  banheiros?: number;
  garagem?: number;
  tipo_imovel?: string;
  ano_construcao?: number;
};

/** Carros */
export type ClassificadoCarro = {
  marca?: string;
  modelo?: string;
  ano?: number;
  quilometragem?: number;
  combustivel?: string;
};

/** Produtos */
export type ClassificadoProduto = {
  marca?: string;
  condicao?: "novo" | "usado";
  estoque?: number;
  sku?: string;
};

/** Blockchain / NFT */
export type ClassificadoNFT = {
  nft_token_id?: string;
  nft_contract?: string;
  blockchain?: string;
  nft_price?: number;
  royalty?: number;
  marketplace_link?: string;
};

/** Monetização */
export type ClassificadoMonetizacao = {
  paywall?: boolean;
  preco_ver_contato?: number;
  nft_anuncio?: boolean;
  anuncio_patrocinado?: boolean;
  duracao_anuncio_dias?: number;
};

export type Classificado = ClassificadoBasico &
  ClassificadoMidia &
  ClassificadoVendedor &
  Partial<ClassificadoImovel> &
  Partial<ClassificadoCarro> &
  Partial<ClassificadoProduto> &
  Partial<ClassificadoNFT> &
  Partial<ClassificadoMonetizacao> & {
    id?: string;
    seller_id?: string;
    views?: number;
    likes?: number;
    created_at?: string;
    expires_at?: string;
    slug?: string;
    featured?: boolean;
    status?: string;
    site_id?: string;
    user_id?: string;
    image_urls?: string[] | null;
  };
