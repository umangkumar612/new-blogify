
-- Drop the overly broad SELECT policy
DROP POLICY "Post images are publicly accessible" ON storage.objects;

-- Create a more specific policy that still allows reading individual files but uses a condition
CREATE POLICY "Post images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] IS NOT NULL);
