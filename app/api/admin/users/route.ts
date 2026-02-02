import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createAdminClient, createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/users/route.ts:4',message:'admin_users_request',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
  // #endregion agent log

  const authHeader = request.headers.get('authorization') || '';
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/users/route.ts:6',message:'admin_users_auth_header',data:{hasAuthHeader:authHeader.length>0,isBearer:authHeader.toLowerCase().startsWith('bearer ')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
  // #endregion agent log

  let authUser = null;
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7);
    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await authClient.auth.getUser(token);
    authUser = data.user ?? null;
  }

  if (!authUser) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/users/route.ts:24',message:'admin_users_unauthorized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/users/route.ts:32',message:'admin_users_missing_service_key',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('user_role')
    .eq('id', authUser.id)
    .single();

  if (profile?.user_role !== 'admin') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/users/route.ts:47',message:'admin_users_forbidden',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: users, error } = await adminSupabase
    .from('profiles')
    .select('id,full_name,username,email,phone,user_role,is_active,created_at')
    .order('created_at', { ascending: false });

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/users/route.ts:60',message:'admin_users_result',data:{hadError:!!error,usersCount:users?.length||0,inactiveUsers:(users||[]).filter((u)=>u.is_active===false).length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
  // #endregion agent log

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(users || []);
}

