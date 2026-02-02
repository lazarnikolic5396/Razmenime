CREATE TABLE IF NOT EXISTS family_request_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES donation_requests(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, helper_id)
);

CREATE INDEX IF NOT EXISTS idx_family_contacts_request_id ON family_request_contacts(request_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_helper_id ON family_request_contacts(helper_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_requester_id ON family_request_contacts(requester_id);
CREATE INDEX IF NOT EXISTS idx_family_contacts_conversation_id ON family_request_contacts(conversation_id);

ALTER TABLE family_request_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family request contacts"
  ON family_request_contacts FOR SELECT
  USING (auth.uid() = helper_id OR auth.uid() = requester_id);

CREATE POLICY "Users can create family request contacts"
  ON family_request_contacts FOR INSERT
  WITH CHECK (auth.uid() = helper_id);

