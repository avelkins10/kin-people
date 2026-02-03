-- RLS for documents and document_templates (planner checklist).
-- App enforces permissions in API (visibility-rules); these policies add defense-in-depth
-- and apply when queries run as Supabase authenticated role (e.g. direct client/dashboard).

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Documents: drop existing if re-run
DROP POLICY IF EXISTS "Users can view their recruit documents" ON documents;
DROP POLICY IF EXISTS "Users can view managed people documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;

CREATE POLICY "Users can view their recruit documents"
ON documents FOR SELECT TO authenticated
USING (
  recruit_id IN (
    SELECT id FROM public.recruits
    WHERE recruiter_id IN (SELECT id FROM public.people WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Users can view managed people documents"
ON documents FOR SELECT TO authenticated
USING (
  person_id IN (
    SELECT id FROM public.people
    WHERE reports_to_id IN (SELECT id FROM public.people WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "Admins can view all documents"
ON documents FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.auth_user_id = auth.uid()
      AND r.name IN ('Admin', 'Owner')
  )
);

-- Document templates
DROP POLICY IF EXISTS "All users can view templates" ON document_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON document_templates;

CREATE POLICY "All users can view templates"
ON document_templates FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage templates"
ON document_templates FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.people p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.auth_user_id = auth.uid()
      AND r.name IN ('Admin', 'Owner')
  )
);

-- Storage: managers can view person-* folders for people who report to them
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view managed people storage documents" ON storage.objects;

  CREATE POLICY "Users can view managed people storage documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'agreements'
    AND (storage.foldername(name))[1] IN (
      SELECT 'person-' || p.id::text
      FROM public.people p
      WHERE p.reports_to_id IN (SELECT id FROM public.people WHERE auth_user_id = auth.uid())
    )
  );
EXCEPTION
  WHEN insufficient_privilege OR OTHERS THEN
    NULL;
END $$;
