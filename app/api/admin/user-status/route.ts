import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient, createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/user-status/route.ts:5',message:'user_status_request',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion agent log
  const authHeader = request.headers.get('authorization') || '';
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/user-status/route.ts:6',message:'user_status_auth_header',data:{hasAuthHeader:authHeader.length>0,isBearer:authHeader.toLowerCase().startsWith('bearer ')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion agent log
  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let authUser = user;
  if (!authUser && authHeader.toLowerCase().startsWith('bearer ')) {
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
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/user-status/route.ts:29',message:'user_status_unauthorized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/user-status/route.ts:64',message:'user_status_missing_service_key',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/user-status/route.ts:44',message:'user_status_forbidden',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = body?.userId as string | undefined;
  const isActive = body?.isActive as boolean | undefined;

  if (!userId || typeof isActive !== 'boolean') {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/user-status/route.ts:56',message:'user_status_bad_request',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data: updated, error } = await adminSupabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select('id,is_active');

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/user-status/route.ts:80',message:'user_status_update_result',data:{hadError:!!error,updatedCount:updated?.length||0,updatedValue:updated?.[0]?.is_active??null},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
  // #endregion agent log

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

