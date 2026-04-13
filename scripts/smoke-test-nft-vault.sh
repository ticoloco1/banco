#!/usr/bin/env bash
set -euo pipefail

# Smoke test: Vault NFT -> QR dinâmico -> Validação lojista -> bloqueio de reuso
#
# Requisitos:
# - APP_URL (ex: https://trustbank.xyz)
# - BEARER_TOKEN (token do usuário dono do NFT no vault)
# - LISTING_ID (id em nft_secondary_listings)
# - WALLET_ID (wallet do usuário dono do NFT)
# - MERCHANT_ID opcional (default: store-smoke)
#
# Exemplo:
# APP_URL="https://trustbank.xyz" \
# BEARER_TOKEN="eyJ..." \
# LISTING_ID="uuid..." \
# WALLET_ID="0xabc..." \
# bash scripts/smoke-test-nft-vault.sh

APP_URL="${APP_URL:-http://localhost:3000}"
BEARER_TOKEN="${BEARER_TOKEN:-}"
LISTING_ID="${LISTING_ID:-}"
WALLET_ID="${WALLET_ID:-}"
MERCHANT_ID="${MERCHANT_ID:-store-smoke}"

if [[ -z "$BEARER_TOKEN" || -z "$LISTING_ID" || -z "$WALLET_ID" ]]; then
  echo "Erro: defina BEARER_TOKEN, LISTING_ID e WALLET_ID."
  exit 1
fi

echo "1) Gerar QR dinâmico (expira em 5 min)"
GEN_RES="$(curl -sS -X POST "$APP_URL/api/nft/vault/generate-qr" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  --data "{\"listingId\":\"$LISTING_ID\",\"walletId\":\"$WALLET_ID\"}")"
echo "$GEN_RES"

TOKEN="$(printf '%s' "$GEN_RES" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(String(j.token||""))}catch{}})')"
if [[ -z "$TOKEN" ]]; then
  echo "Erro: não foi possível obter token do QR."
  exit 1
fi

echo ""
echo "2) Validar QR no modo lojista (primeiro uso)"
VAL1="$(curl -sS -X POST "$APP_URL/api/nft/vault/validate-qr" \
  -H "Content-Type: application/json" \
  --data "{\"token\":\"$TOKEN\",\"merchantId\":\"$MERCHANT_ID\"}")"
echo "$VAL1"

echo ""
echo "3) Tentar reutilizar o mesmo QR (deve falhar)"
set +e
VAL2="$(curl -sS -o /tmp/tb_qr_reuse.json -w "%{http_code}" -X POST "$APP_URL/api/nft/vault/validate-qr" \
  -H "Content-Type: application/json" \
  --data "{\"token\":\"$TOKEN\",\"merchantId\":\"$MERCHANT_ID\"}")"
set -e
echo "HTTP $VAL2"
cat /tmp/tb_qr_reuse.json

echo ""
echo "OK: fluxo smoke concluído."
