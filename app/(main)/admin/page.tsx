'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type AdRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  user_id: string;
  category?: { name: string } | null;
  owner?: { full_name: string | null; email: string | null } | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  user_role: string | null;
  is_active: boolean | null;
  created_at: string;
};

type TabKey = 'pending-ads' | 'all-ads' | 'users';
type UserFilter = 'all' | 'active' | 'inactive';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('pending-ads');
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [pendingAds, setPendingAds] = useState<AdRow[]>([]);
  const [allAds, setAllAds] = useState<AdRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdmin = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role')
        .eq('id', user.id)
        .single();

      if (profile?.user_role === 'admin') {
        setIsAdmin(true);
        await loadAdminData();
      }
    } catch (err) {
      console.error('Error checking admin:', err);
      setError('Došlo je do greške prilikom provere admin naloga.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    setError(null);
    try {
      const [{ data: sessionData }, pendingAdsResult, allAdsResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from('ads')
          .select(
            'id,title,status,created_at,user_id,category:categories(name),owner:profiles!ads_user_id_fkey(full_name,email)'
          )
          .eq('status', 'inactive')
          .order('created_at', { ascending: false }),
        supabase
          .from('ads')
          .select(
            'id,title,status,created_at,user_id,category:categories(name),owner:profiles!ads_user_id_fkey(full_name,email)'
          )
          .order('created_at', { ascending: false }),
      ]);

      const usersResponse = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: sessionData.session?.access_token
            ? `Bearer ${sessionData.session.access_token}`
            : '',
        },
      });
      const usersResult = usersResponse.ok ? await usersResponse.json() : null;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:93',message:'admin_load_results',data:{pendingError:!!pendingAdsResult.error,allAdsError:!!allAdsResult.error,usersOk:!!usersResponse.ok,pendingCount:pendingAdsResult.data?.length||0,allAdsCount:allAdsResult.data?.length||0,usersCount:usersResult?.length||0,inactiveUsers:(usersResult||[]).filter((u)=>u.is_active===false).length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
      // #endregion agent log

      if (pendingAdsResult.error || allAdsResult.error || !usersResponse.ok) {
        throw pendingAdsResult.error || allAdsResult.error || new Error('Users load failed');
      }

      setPendingAds((pendingAdsResult.data || []) as AdRow[]);
      setAllAds((allAdsResult.data || []) as AdRow[]);
      const userRows = (usersResult || []) as UserRow[];
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:108',message:'admin_users_loaded',data:{usersCount:userRows.length,inactiveUsers:userRows.filter((u)=>u.is_active===false).length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
      // #endregion agent log
      setUsers(userRows);
    } catch (err) {
      console.error('Error loading admin data:', err);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:106',message:'admin_load_error',data:{hasError:true},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H7'})}).catch(()=>{});
      // #endregion agent log
      setError('Ne možemo da učitamo admin podatke.');
    }
  };

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalAds: allAds.length,
      pendingAds: pendingAds.length,
    }),
    [allAds.length, pendingAds.length, users.length]
  );

  const filteredPendingAds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pendingAds;
    return pendingAds.filter((ad) => {
      const title = ad.title.toLowerCase();
      const owner = ad.owner?.full_name?.toLowerCase() || '';
      const email = ad.owner?.email?.toLowerCase() || '';
      return title.includes(query) || owner.includes(query) || email.includes(query);
    });
  }, [pendingAds, searchQuery]);

  const filteredAllAds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allAds;
    return allAds.filter((ad) => {
      const title = ad.title.toLowerCase();
      const owner = ad.owner?.full_name?.toLowerCase() || '';
      const email = ad.owner?.email?.toLowerCase() || '';
      return title.includes(query) || owner.includes(query) || email.includes(query);
    });
  }, [allAds, searchQuery]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let source = users;
    if (userFilter === 'active') {
      source = source.filter((user) => user.is_active !== false);
    } else if (userFilter === 'inactive') {
      source = source.filter((user) => user.is_active === false);
    }
    if (!query) return source;
    return source.filter((user) => {
      const name = user.full_name?.toLowerCase() || '';
      const username = user.username?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      return name.includes(query) || username.includes(query) || email.includes(query);
    });
  }, [searchQuery, userFilter, users]);

  const handleApproveAd = async (adId: string) => {
    if (workingId) return;
    setWorkingId(adId);
    const { error: updateError } = await supabase
      .from('ads')
      .update({ status: 'active' })
      .eq('id', adId);

    if (updateError) {
      setError('Odobravanje nije uspelo. Pokušajte ponovo.');
      setWorkingId(null);
      return;
    }

    setPendingAds((prev) => prev.filter((ad) => ad.id !== adId));
    setAllAds((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, status: 'active' } : ad))
    );
    setWorkingId(null);
  };

  const handleRemoveAd = async (adId: string) => {
    if (workingId) return;
    const confirmed = window.confirm('Da li ste sigurni da želite da uklonite ovaj oglas?');
    if (!confirmed) return;

    const reason = window.prompt('Razlog uklanjanja (opciono):', '') || null;
    setWorkingId(adId);
    const { error: removeError } = await supabase
      .from('ads')
      .update({ status: 'removed_by_admin', removed_reason: reason })
      .eq('id', adId);

    if (removeError) {
      setError('Uklanjanje nije uspelo. Pokušajte ponovo.');
      setWorkingId(null);
      return;
    }

    setPendingAds((prev) => prev.filter((ad) => ad.id !== adId));
    setAllAds((prev) =>
      prev.map((ad) => (ad.id === adId ? { ...ad, status: 'removed_by_admin' } : ad))
    );
    setWorkingId(null);
  };

  const handleDeactivateUser = async (userId: string) => {
    if (workingId) return;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:167',message:'deactivate_click',data:{userIdPrefix:userId.slice(0,8)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    const confirmed = window.confirm('Da li ste sigurni da želite da deaktivirate korisnika?');
    if (!confirmed) return;

    setWorkingId(userId);
    const { data: sessionData } = await supabase.auth.getSession();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:174',message:'deactivate_session_check',data:{hasSession:!!sessionData.session,hasAccessToken:!!sessionData.session?.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion agent log
    const response = await fetch('/api/admin/user-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: sessionData.session?.access_token
          ? `Bearer ${sessionData.session.access_token}`
          : '',
      },
      body: JSON.stringify({ userId, isActive: false }),
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:180',message:'deactivate_result',data:{userIdPrefix:userId.slice(0,8),ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log

    if (!response.ok) {
      setError('Deaktivacija nije uspela.');
      setWorkingId(null);
      return;
    }

    await supabase
      .from('ads')
      .update({
        status: 'removed_by_admin',
        removed_reason: 'Uklonjeno zbog deaktivacije korisnika',
      })
      .eq('user_id', userId);

    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, is_active: false } : user))
    );
    setPendingAds((prev) => prev.filter((ad) => ad.user_id !== userId));
    setAllAds((prev) =>
      prev.map((ad) =>
        ad.user_id === userId ? { ...ad, status: 'removed_by_admin' } : ad
      )
    );
    setWorkingId(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (workingId) return;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:203',message:'delete_click',data:{userIdPrefix:userId.slice(0,8)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log
    const confirmed = window.confirm(
      'Da li ste sigurni da želite da obrišete korisnika? Ova akcija briše sve njegove podatke.'
    );
    if (!confirmed) return;

    setWorkingId(userId);
    const { data: sessionData } = await supabase.auth.getSession();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:217',message:'delete_session_check',data:{hasSession:!!sessionData.session,hasAccessToken:!!sessionData.session?.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion agent log
    const response = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: sessionData.session?.access_token
          ? `Bearer ${sessionData.session.access_token}`
          : '',
      },
      body: JSON.stringify({ userId }),
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:219',message:'delete_response',data:{userIdPrefix:userId.slice(0,8),ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion agent log

    if (!response.ok) {
      setError('Brisanje nije uspelo.');
      setWorkingId(null);
      return;
    }

    setUsers((prev) => prev.filter((user) => user.id !== userId));
    setPendingAds((prev) => prev.filter((ad) => ad.user_id !== userId));
    setAllAds((prev) => prev.filter((ad) => ad.user_id !== userId));
    setWorkingId(null);
  };

  const handleActivateUser = async (userId: string) => {
    if (workingId) return;
    setWorkingId(userId);
    const { data: sessionData } = await supabase.auth.getSession();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:326',message:'activate_session_check',data:{hasSession:!!sessionData.session,hasAccessToken:!!sessionData.session?.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H8'})}).catch(()=>{});
    // #endregion agent log
    const response = await fetch('/api/admin/user-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: sessionData.session?.access_token
          ? `Bearer ${sessionData.session.access_token}`
          : '',
      },
      body: JSON.stringify({ userId, isActive: true }),
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d0665831-32e2-428b-a674-2b77c39b9210',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/(main)/admin/page.tsx:254',message:'activate_result',data:{userIdPrefix:userId.slice(0,8),ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion agent log

    if (!response.ok) {
      setError('Aktivacija nije uspela.');
      setWorkingId(null);
      return;
    }

    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, is_active: true } : user))
    );
    setWorkingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <p className="text-[#9CA3AF]">Učitavanje...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl px-6 py-5">
          <p className="text-[#9CA3AF] text-center">Nemate pristup ovoj stranici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-[#E6E9F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B7280]">Admin kontrola</p>
            <h1 className="text-3xl font-semibold">Kontrolni centar</h1>
            <p className="text-sm text-[#9CA3AF]">
              Moderacija oglasa, korisnika i sadržaja.
            </p>
          </div>
          <Button variant="outline" onClick={loadAdminData} className="text-white">
            Osveži podatke
          </Button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <p className="text-sm text-[#9CA3AF]">Ukupno korisnika</p>
            <p className="text-2xl font-semibold mt-1">{stats.totalUsers}</p>
          </div>
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <p className="text-sm text-[#9CA3AF]">Ukupno oglasa</p>
            <p className="text-2xl font-semibold mt-1">{stats.totalAds}</p>
          </div>
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4">
            <p className="text-sm text-[#9CA3AF]">Oglasi na čekanju</p>
            <p className="text-2xl font-semibold mt-1">{stats.pendingAds}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['pending-ads', 'all-ads', 'users'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                activeTab === tab
                  ? 'bg-[#E53935] border-[#E53935] text-white'
                  : 'border-[#1f2937] text-[#E5E7EB] hover:text-white hover:border-[#374151]'
              }`}
            >
              {tab === 'pending-ads' && 'Oglasi na čekanju'}
              {tab === 'all-ads' && 'Svi oglasi'}
              {tab === 'users' && 'Korisnici'}
            </button>
          ))}
        </div>

        {activeTab === 'pending-ads' && (
          <section className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">Oglasi na čekanju</h2>
              <div className="w-full md:w-72 md:ml-auto">
                <Input
                  placeholder="Pretraži oglase..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="bg-[#111827] text-white border-[#1f2937] placeholder:text-[#6B7280]"
                />
              </div>
            </div>
            {filteredPendingAds.length === 0 ? (
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 text-[#9CA3AF]">
                {searchQuery.trim()
                  ? 'Nema rezultata za zadatu pretragu.'
                  : 'Trenutno nema oglasa na čekanju.'}
              </div>
            ) : (
              filteredPendingAds.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                      {ad.category?.name || 'Bez kategorije'}
                    </p>
                    <h3 className="text-lg font-semibold">{ad.title}</h3>
                    <p className="text-sm text-[#9CA3AF]">
                      {ad.owner?.full_name || 'Korisnik'} • {ad.owner?.email || '—'}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(ad.created_at).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={workingId === ad.id}
                      onClick={() => handleApproveAd(ad.id)}
                    >
                      {workingId === ad.id ? 'Odobravam...' : 'Odobri'}
                    </Button>
                  <Button
                      variant="outline"
                      size="sm"
                    className="text-white"
                      disabled={workingId === ad.id}
                      onClick={() => handleRemoveAd(ad.id)}
                    >
                      Ukloni
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === 'all-ads' && (
          <section className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold">Svi oglasi</h2>
              <div className="w-full md:w-72 md:ml-auto">
                <Input
                  placeholder="Pretraži oglase..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="bg-[#111827] text-white border-[#1f2937] placeholder:text-[#6B7280]"
                />
              </div>
            </div>
            {filteredAllAds.length === 0 ? (
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 text-[#9CA3AF]">
                {searchQuery.trim() ? 'Nema rezultata za zadatu pretragu.' : 'Trenutno nema oglasa.'}
              </div>
            ) : (
              filteredAllAds.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                      {ad.category?.name || 'Bez kategorije'}
                    </p>
                    <h3 className="text-lg font-semibold">{ad.title}</h3>
                    <p className="text-sm text-[#9CA3AF]">
                      {ad.owner?.full_name || 'Korisnik'} • {ad.owner?.email || '—'}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(ad.created_at).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        ad.status === 'active'
                          ? 'bg-green-500/10 text-green-300'
                          : ad.status === 'inactive'
                          ? 'bg-yellow-500/10 text-yellow-300'
                          : 'bg-red-500/10 text-red-300'
                      }`}
                    >
                      {ad.status === 'active'
                        ? 'Aktivan'
                        : ad.status === 'inactive'
                        ? 'Na čekanju'
                        : 'Uklonjen'}
                    </span>
                    <div className="flex items-center gap-2">
                      {ad.status === 'inactive' && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={workingId === ad.id}
                          onClick={() => handleApproveAd(ad.id)}
                        >
                          Odobri
                        </Button>
                      )}
                      {ad.status !== 'removed_by_admin' && (
                      <Button
                          variant="outline"
                          size="sm"
                        className="text-white"
                          disabled={workingId === ad.id}
                          onClick={() => handleRemoveAd(ad.id)}
                        >
                          Ukloni
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === 'users' && (
          <section className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold">Korisnici</h2>
                <div className="w-full md:w-72 md:ml-auto">
                  <Input
                    placeholder="Pretraži korisnike..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="bg-[#111827] text-white border-[#1f2937] placeholder:text-[#6B7280]"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'inactive'] as UserFilter[]).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setUserFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      userFilter === filterKey
                        ? 'bg-[#E53935] border-[#E53935] text-white'
                        : 'border-[#1f2937] text-[#E5E7EB] hover:text-white hover:border-[#374151]'
                    }`}
                  >
                    {filterKey === 'all' && 'Svi'}
                    {filterKey === 'active' && 'Aktivni'}
                    {filterKey === 'inactive' && 'Deaktivirani'}
                  </button>
                ))}
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 text-[#9CA3AF]">
                {searchQuery.trim()
                  ? 'Nema rezultata za zadatu pretragu.'
                  : 'Trenutno nema korisnika.'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#6B7280]">
                      {user.user_role || 'korisnik'}
                    </p>
                    <h3 className="text-lg font-semibold">
                      {user.full_name || user.username || 'Korisnik'}
                    </h3>
                    <p className="text-sm text-[#9CA3AF]">{user.email || '—'}</p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(user.created_at).toLocaleDateString('sr-RS')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.is_active === false
                          ? 'bg-yellow-500/10 text-yellow-300'
                          : 'bg-green-500/10 text-green-300'
                      }`}
                    >
                      {user.is_active === false ? 'Deaktiviran' : 'Aktivan'}
                    </span>
                    {user.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                      className="text-white"
                        disabled={workingId === user.id}
                        onClick={() => handleDeactivateUser(user.id)}
                      >
                        Deaktiviraj
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={workingId === user.id}
                        onClick={() => handleActivateUser(user.id)}
                      >
                        Aktiviraj
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-300 border-red-500/60 hover:text-red-200 hover:border-red-400"
                    disabled={workingId === user.id}
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Obriši
                  </Button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>
    </div>
  );
}

