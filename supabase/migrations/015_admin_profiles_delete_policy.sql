-- Allow admins to delete any profile
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.user_role = 'admin'
    )
  );

