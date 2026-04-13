#!/usr/bin/env bash
# Backup lógico PostgreSQL (Supabase) — mini-sites, utilizadores, analytics, etc.
#
# 1) No Supabase: Project Settings → Database → Connection string
#    Usa a URI em modo DIRECT (porta 5432), não o pooler "Transaction", para o pg_dump funcionar bem.
# 2) Exporta a variável antes de correr (não commites a URL com password):
#    export DATABASE_URL='postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres'
#    (ou o host db.[ref].supabase.co conforme o painel mostrar)
#
# Opcional: SCHEMA_ONLY=1 → só estrutura (sem dados), ficheiro mais pequeno.
#
# Restaurar (exemplo, para uma base vazia nova):
#   gunzip -c backups/trustbank-XXXX.sql.gz | psql "$DATABASE_URL"
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Instala o cliente PostgreSQL (inclui pg_dump). macOS: brew install libpq && brew link --force libpq"
  exit 1
fi

URL="${DATABASE_URL:-${DIRECT_URL:-}}"
if [ -z "$URL" ]; then
  echo "Erro: define DATABASE_URL ou DIRECT_URL com a connection string PostgreSQL (ver comentários no topo deste script)."
  exit 1
fi

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backups/trustbank-${STAMP}.sql"

ARGS=(--no-owner --no-acl --verbose)
if [ "${SCHEMA_ONLY:-0}" = "1" ]; then
  ARGS+=(--schema-only)
  echo "Modo: apenas schema (sem dados)."
fi

echo "A criar backup em ${OUT} ..."
pg_dump "${ARGS[@]}" "$URL" -f "$OUT"
gzip -f "$OUT"
echo "Concluído: ${OUT}.gz"
echo "Guarda uma cópia fora deste portátil (Drive, S3, etc.). A pasta backups/ não vai para o Git."
