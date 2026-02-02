-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view active profiles"
  ON profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Anyone can view verified organizations"
  ON organizations FOR SELECT
  USING (verification_status = 'verified');

CREATE POLICY "Organizations can view their own record"
  ON organizations FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Organizations can insert their own record"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Organizations can update their own record"
  ON organizations FOR UPDATE
  USING (auth.uid() = profile_id);

-- RLS Policies for families
CREATE POLICY "Anyone can view families"
  ON families FOR SELECT
  USING (true);

CREATE POLICY "Families can view their own record"
  ON families FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Families can insert their own record"
  ON families FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Families can update their own record"
  ON families FOR UPDATE
  USING (auth.uid() = profile_id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

-- RLS Policies for locations
CREATE POLICY "Anyone can view locations"
  ON locations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert locations"
  ON locations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for ads
CREATE POLICY "Anyone can view active ads"
  ON ads FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view their own ads"
  ON ads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all ads"
  ON ads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create ads"
  ON ads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads"
  ON ads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ads"
  ON ads FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any ad"
  ON ads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_role = 'admin'
    )
  );

-- RLS Policies for donation_requests
CREATE POLICY "Anyone can view active donation requests"
  ON donation_requests FOR SELECT
  USING (status = 'active');

CREATE POLICY "Requesters can view their own requests"
  ON donation_requests FOR SELECT
  USING (auth.uid() = requester_id);

CREATE POLICY "Authenticated users can create donation requests"
  ON donation_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update their own requests"
  ON donation_requests FOR UPDATE
  USING (auth.uid() = requester_id);

-- RLS Policies for donations
CREATE POLICY "Donors can view their own donations"
  ON donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Request owners can view donations to their requests"
  ON donations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donation_requests
      WHERE donation_requests.id = donations.request_id
      AND donation_requests.requester_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- RLS Policies for activity_logs
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for reported_content
CREATE POLICY "Anyone can create reports"
  ON reported_content FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view their own reports"
  ON reported_content FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON reported_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports"
  ON reported_content FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_role = 'admin'
    )
  );

