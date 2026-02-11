import { supabase } from '@/lib/supabase';

/**
 * Uploads an avatar image to Supabase Storage and returns the public URL.
 * @param userId The user's ID
 * @param imageUri The local URI of the image to upload
 * @returns The public URL of the uploaded image
 */
export const uploadAvatar = async (userId: string, imageUri: string): Promise<string> => {
    try {
        const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Fetch the file as a blob for upload
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Upload to Storage (avatars bucket)
        const { error: storageError } = await supabase.storage
            .from('avatars')
            .upload(filePath, blob, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: true,
            });

        if (storageError) {
            console.error('Avatar upload error:', storageError);
            throw new Error(`Upload failed: ${storageError.message}`);
        }

        // Get Public URL
        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading avatar:', error);
        throw error;
    }
};
