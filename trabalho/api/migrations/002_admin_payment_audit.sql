BEGIN;

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS papel text NOT NULL DEFAULT 'cliente';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'perfis_papel_check'
      AND conrelid = 'public.perfis'::regclass
  ) THEN
    ALTER TABLE public.perfis
      ADD CONSTRAINT perfis_papel_check
      CHECK (papel IN ('cliente', 'admin'));
  END IF;
END $$;

ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS pagamento_validado_por uuid
    REFERENCES public.perfis(id),
  ADD COLUMN IF NOT EXISTS pagamento_validado_em timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vendas_pagamento_validado_audit_check'
      AND conrelid = 'public.vendas'::regclass
  ) THEN
    ALTER TABLE public.vendas
      ADD CONSTRAINT vendas_pagamento_validado_audit_check
      CHECK (
        (pagamento_validado_por IS NULL AND pagamento_validado_em IS NULL)
        OR (pagamento_validado_por IS NOT NULL AND pagamento_validado_em IS NOT NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS vendas_criado_em_idx
  ON public.vendas (criado_em DESC);

COMMIT;
