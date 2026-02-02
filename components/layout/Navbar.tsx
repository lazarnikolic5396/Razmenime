'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<null | { user: { id: string; email?: string | null } }>(
    null
  );
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isFamilyUser, setIsFamilyUser] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (userId: string, fallbackEmail?: string | null) => {
      setProfileEmail(fallbackEmail ?? null);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name,email,user_role')
        .eq('id', userId)
        .single();

      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle();

      if (!isMounted) return;

      setProfileName(profile?.full_name ?? null);
      setProfileEmail(profile?.email ?? fallbackEmail ?? null);
      setUserRole(profile?.user_role ?? null);
      setIsFamilyUser(!!family);
    };

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (data.session?.user) {
        setSession({ user: { id: data.session.user.id, email: data.session.user.email } });
        await loadProfile(data.session.user.id, data.session.user.email);
      } else {
        setSession(null);
        setProfileName(null);
        setProfileEmail(null);
        setUserRole(null);
        setIsFamilyUser(false);
      }
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setMenuOpen(false);
      if (newSession?.user) {
        setSession({ user: { id: newSession.user.id, email: newSession.user.email } });
        void loadProfile(newSession.user.id, newSession.user.email);
      } else {
        setSession(null);
        setProfileName(null);
        setProfileEmail(null);
        setUserRole(null);
        setIsFamilyUser(false);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Početna' },
    { href: '/mapa-donacija', label: 'Mapa Donacija' },
    { href: '/kategorije', label: 'Kategorije' },
    { href: '/o-crvenom-krstu', label: 'O Crvenom Krstu' },
  ];

  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <nav className="bg-[#0b0f1a] border-b border-[#111827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-[#E53935]">✚</span>
              <span className="text-xl font-semibold text-white">Razmeni me Admin</span>
            </Link>

            <div className="flex items-center gap-3">
              {profileEmail && (
                <span className="text-sm text-[#9CA3AF] hidden sm:inline">
                  {profileName || profileEmail}
                </span>
              )}
              {session ? (
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Odjavi se
                </Button>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Prijavi se
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-[#E53935]">✚</span>
            <span className="text-xl font-semibold text-[#333333]">Razmeni me</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'text-base font-medium transition-colors',
                  pathname === link.href
                    ? 'text-[#E53935]'
                    : 'text-[#333333] hover:text-[#E53935]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Auth */}
            {session ? (
              <div className="relative">
                <button
                  className="flex items-center space-x-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-[#333333] hover:bg-gray-50"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  type="button"
                >
                  <span className="font-medium">
                    {profileName || profileEmail || 'Moj profil'}
                  </span>
                  <span className="text-gray-500">▾</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md z-20">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {profileEmail || 'Prijavljeni ste'}
                    </div>
                    <Link
                      href="/zahtevi"
                      className="block px-4 py-2 text-sm text-[#333333] hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Zahtevi
                    </Link>
                    <Link
                      href="/profil"
                      className="block px-4 py-2 text-sm text-[#333333] hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Moj profil
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-[#E53935] hover:bg-red-50"
                      onClick={handleLogout}
                      type="button"
                    >
                      Odjavi se
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Prijavi se
                </Button>
              </Link>
            )}

            {/* Donate/Register Button */}
            {session ? (
              <Link href={isFamilyUser ? '/potrebe/novo' : '/doniraj'}>
                <Button variant="primary" size="md">
                  {isFamilyUser ? 'ZATRAŽI POMOĆ' : 'DONIRAJ STVARI'}
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button variant="primary" size="md">
                  REGISTRACIJA
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

