ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_images_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid() = owner
);

CREATE POLICY "chat_images_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'chat-images');

