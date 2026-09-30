import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// For client-side (customer portal)
export const supabasePublic = createClient(
  supabaseUrl,
  process.env.SUPABASE_ANON_KEY!
);

// Upload document to Supabase Storage
export async function uploadDocument(
  requestId: string,
  file: Buffer,
  fileName: string
): Promise<string> {
  const filePath = `requests/${requestId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf'
    });

  if (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Delete document from Supabase Storage
export async function deleteDocument(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}