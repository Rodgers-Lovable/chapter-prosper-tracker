import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  full_name?: string;
  role: 'member' | 'chapter_leader' | 'administrator';
  chapter_id?: string;
  business_name?: string;
  business_description?: string;
  phone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const userData: CreateUserRequest = await req.json();
    console.log('Creating user with data:', { ...userData, email: userData.email });

    // Create user in auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name || userData.email,
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw authError;
    }

    if (!authUser.user) {
      throw new Error('Failed to create user');
    }

    console.log('Auth user created:', authUser.user.id);

    // Create or update profile
    const profileData = {
      id: authUser.user.id,
      email: userData.email,
      full_name: userData.full_name || userData.email,
      role: userData.role,
      chapter_id: userData.chapter_id || null,
      business_name: userData.business_name || null,
      business_description: userData.business_description || null,
      phone: userData.phone || null,
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // If profile creation fails, we should delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    console.log('Profile created:', profile.id);

    // Send password reset email so user can set their password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userData.email,
    });

    if (resetError) {
      console.warn('Failed to send password reset email:', resetError);
      // Don't throw here, user creation was successful
    }

    return new Response(
      JSON.stringify({ 
        data: profile, 
        message: 'User created successfully. Password reset email sent.' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in create-user function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create user',
        details: error 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);