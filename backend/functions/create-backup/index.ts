import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { backupType = 'manual' } = await req.json();

    console.log(`Creating ${backupType} backup for user ${user.id}`);

    // Fetch all user data
    const [documents, categories, subcategories, folders, nominees, timeCapsules, profile] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('categories').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('subcategories').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('folders').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('nominees').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('time_capsules').select('*').eq('user_id', user.id).is('deleted_at', null),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    // Create backup data object
    const backupData = {
      timestamp: new Date().toISOString(),
      user_id: user.id,
      documents: documents.data || [],
      categories: categories.data || [],
      subcategories: subcategories.data || [],
      folders: folders.data || [],
      nominees: nominees.data || [],
      time_capsules: timeCapsules.data || [],
      profile: profile.data || null,
    };

    const backupJson = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupJson], { type: 'application/json' });
    const fileName = `${user.id}/${Date.now()}_backup.json`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(fileName, backupBlob, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Create database record
    const { error: dbError } = await supabase
      .from('backups')
      .insert({
        user_id: user.id,
        backup_type: backupType,
        file_path: fileName,
        file_size: backupBlob.size,
        status: 'completed',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log(`Backup created successfully: ${fileName}`);

    return new Response(
      JSON.stringify({ success: true, fileName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating backup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
