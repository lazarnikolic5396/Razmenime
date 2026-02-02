import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient, createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:4',message:'delete_user_request',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion agent log
  const cookieHeader = request.headers.get('cookie') || '';
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:6',message:'delete_user_cookie_header',data:{hasCookie:cookieHeader.length>0,cookieLength:cookieHeader.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion agent log
  const authHeader = request.headers.get('authorization') || '';
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:7',message:'delete_user_auth_header',data:{hasAuthHeader:authHeader.length>0,isBearer:authHeader.toLowerCase().startsWith('bearer ')},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6'})}).catch(()=>{});
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
  const { data: sessionData } = await supabase.auth.getSession();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:13',message:'delete_user_auth_state',data:{hasUser:!!user,hasSession:!!sessionData.session},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion agent log
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
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:12',message:'delete_user_unauthorized',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:41',message:'delete_user_missing_service_key',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:23',message:'delete_user_forbidden',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const userId = body?.userId as string | undefined;

  if (!userId) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:33',message:'delete_user_missing_id',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(userId);
  if (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:56',message:'delete_user_admin_error',data:{errorMessage:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/delete-user/route.ts:61',message:'delete_user_success',data:{userIdPrefix:userId.slice(0,8)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion agent log
  return NextResponse.json({ ok: true });
}

