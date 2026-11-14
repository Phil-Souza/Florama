BEGIN;

-- A tabela perfis do banco inicial guarda os dados básicos, mas ainda não autentica.
-- O backend guarda somente o hash Argon2, nunca a senha original.
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS senha_hash text,
  ADD COLUMN IF NOT EXISTS endereco text;

COMMIT;