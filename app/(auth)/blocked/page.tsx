'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function BlockedPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut();
      router.refresh();
    };

    signOut();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#FDF7F7] flex items-center justify-center px-4">
      <Card padding="lg" className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold text-[#333333]">Nalog je deaktiviran</h1>
        <p className="text-sm text-[#666666]">
          Vaš nalog je privremeno blokiran. Obratite se administratoru za više informacija.
        </p>
        <Link href="/login">
          <Button variant="primary" className="w-full">
            Prijavi se ponovo
          </Button>
        </Link>
      </Card>
    </div>
  );
}

