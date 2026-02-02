-- Create ad_requests table for linking item requests to conversations
CREATE TABLE IF NOT EXISTS ad_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ad_id, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_requests_ad_id ON ad_requests(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_requester_id ON ad_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_ad_requests_conversation_id ON ad_requests(conversation_id);

ALTER TABLE ad_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters can view their own ad requests"
  ON ad_requests FOR SELECT
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM ads
      WHERE ads.id = ad_requests.ad_id
        AND ads.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create ad requests"
  ON ad_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

