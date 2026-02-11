import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListFilesRequest {
  action: 'list';
  accessToken: string;
  folderId?: string;
  pageToken?: string;
}

interface DownloadFileRequest {
  action: 'download';
  accessToken: string;
  fileId: string;
  mimeType: string;
}

interface SearchFilesRequest {
  action: 'search';
  accessToken: string;
  query: string;
  pageToken?: string;
}

type RequestBody = ListFilesRequest | DownloadFileRequest | SearchFilesRequest;

// Map Google Docs mime types to export formats
const GOOGLE_DOCS_EXPORT_TYPES: Record<string, string> = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/vnd.google-apps.drawing': 'application/pdf',
};

// Validate user JWT and return user info
async function validateUser(req: Request): Promise<{ userId: string; email: string } | null> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    console.error("[Google Drive Proxy] Missing authorization header");
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader }
    }
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("[Google Drive Proxy] JWT validation failed:", error?.message);
    return null;
  }

  return { userId: user.id, email: user.email || "unknown" };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication first
    const user = await validateUser(req);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - valid authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    
    // Security audit logging with user context
    console.log(`[Google Drive Proxy] User: ${user.userId} (${user.email}), Action: ${body.action}`);

    if (!body.accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing access token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (body.action) {
      case 'list': {
        const { accessToken, folderId, pageToken } = body;
        const parentId = folderId || 'root';
        
        let url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+trashed=false&fields=nextPageToken,files(id,name,mimeType,iconLink,thumbnailLink,modifiedTime,size)&pageSize=50&orderBy=folder,name`;
        
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }

        console.log(`[Google Drive Proxy] User ${user.userId} listing files in folder: ${parentId}`);
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`[Google Drive Proxy] User ${user.userId} list error:`, error);
          return new Response(
            JSON.stringify({ error: 'Failed to list files', details: error }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        console.log(`[Google Drive Proxy] User ${user.userId} found ${data.files?.length || 0} files`);
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search': {
        const { accessToken, query, pageToken } = body;
        
        const escapedQuery = query.replace(/'/g, "\\'");
        let url = `https://www.googleapis.com/drive/v3/files?q=name+contains+'${escapedQuery}'+and+trashed=false&fields=nextPageToken,files(id,name,mimeType,iconLink,thumbnailLink,modifiedTime,size)&pageSize=50&orderBy=folder,name`;
        
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }

        console.log(`[Google Drive Proxy] User ${user.userId} searching for: ${query}`);
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`[Google Drive Proxy] User ${user.userId} search error:`, error);
          return new Response(
            JSON.stringify({ error: 'Failed to search files', details: error }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        console.log(`[Google Drive Proxy] User ${user.userId} found ${data.files?.length || 0} files`);
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'download': {
        const { accessToken, fileId, mimeType } = body;
        
        let downloadUrl: string;
        let finalMimeType = mimeType;
        
        // Check if it's a Google Docs file that needs export
        if (GOOGLE_DOCS_EXPORT_TYPES[mimeType]) {
          const exportMimeType = GOOGLE_DOCS_EXPORT_TYPES[mimeType];
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
          finalMimeType = exportMimeType;
          console.log(`[Google Drive Proxy] User ${user.userId} exporting file ${fileId} as: ${exportMimeType}`);
        } else {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
          console.log(`[Google Drive Proxy] User ${user.userId} downloading file ${fileId} directly`);
        }

        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const error = await response.text();
          console.error(`[Google Drive Proxy] User ${user.userId} download error for file ${fileId}:`, error);
          return new Response(
            JSON.stringify({ error: 'Failed to download file', details: error }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        console.log(`[Google Drive Proxy] User ${user.userId} downloaded file ${fileId}, size: ${blob.size}`);
        
        return new Response(
          JSON.stringify({ data: base64, mimeType: finalMimeType, size: blob.size }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[Google Drive Proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
