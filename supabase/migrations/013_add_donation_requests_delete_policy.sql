-- Allow requesters to delete their own donation requests
CREATE POLICY "Requesters can delete their own requests"
  ON donation_requests FOR DELETE
  USING (auth.uid() = requester_id);

