import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    console.log("Deleting account for user:", user.id);

    const now = new Date().toISOString();

    // First, get all nominee IDs for this user
    const { data: nominees } = await supabase
      .from("nominees")
      .select("id")
      .eq("user_id", user.id);

    const nomineeIds = nominees?.map(n => n.id) || [];

    // Soft delete all user data
    await supabase.from("documents").update({ deleted_at: now }).eq("user_id", user.id);
    await supabase.from("folders").update({ deleted_at: now }).eq("user_id", user.id);
    await supabase.from("categories").update({ deleted_at: now }).eq("user_id", user.id);
    await supabase.from("subcategories").update({ deleted_at: now }).eq("user_id", user.id);
    await supabase.from("nominees").update({ deleted_at: now }).eq("user_id", user.id);
    await supabase.from("time_capsules").update({ deleted_at: now }).eq("user_id", user.id);
    
    // Hard delete some tables
    await supabase.from("access_controls").delete().eq("user_id", user.id);
    
    // Delete verification tokens for user's nominees
    if (nomineeIds.length > 0) {
      await supabase.from("verification_tokens").delete().in("nominee_id", nomineeIds);
    }
    
    await supabase.from("quick_actions").delete().eq("user_id", user.id);
    await supabase.from("user_sessions").delete().eq("user_id", user.id);
    await supabase.from("activity_logs").delete().eq("user_id", user.id);
    await supabase.from("backups").delete().eq("user_id", user.id);
    await supabase.from("two_fa_verifications").delete().eq("user_id", user.id);

    // Delete user from auth (this will cascade delete profile)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Failed to delete user from auth:", deleteError);
      throw new Error("Failed to delete user account");
    }

    console.log("User account deleted successfully:", user.id);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-user-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);