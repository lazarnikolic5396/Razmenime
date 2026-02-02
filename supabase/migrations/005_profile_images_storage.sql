-- Enable RLS on storage objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload profile images to the profile-images bucket
CREATE POLICY "profile_images_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.uid() = owner
);

-- Allow authenticated users to update their own profile images
CREATE POLICY "profile_images_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid() = owner
);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "profile_images_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images'
  AND auth.uid() = owner
);

-- Allow public read access to profile images
CREATE POLICY "profile_images_select"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-images');

