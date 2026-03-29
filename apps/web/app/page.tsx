//runsan-offera/apps/web/app/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { Loader2 } from 'lucide-react';
export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/home'); // handled by (dashboard)/page.tsx
    } else {
      router.replace('/landing');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show spinner while deciding
//   return (
//     <div className="flex h-screen items-center justify-center bg-background">
//       <Spinner className="h-8 w-8 text-primary" />
//     </div>
//   );
// }
 return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4"
      style={{
        background:
          "linear-gradient(135deg, #0a0f2e 0%, #0d0a2e 25%, #1a0a2e 50%, #2d0a3e 75%, #1a0520 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Same decorative blurs as login page */}
      <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-orange-100/50 blur-[120px] dark:bg-orange-900/20" />
      <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-orange-50/50 blur-[120px] dark:bg-slate-900/50" />
      <Loader2 className="relative z-10 h-8 w-8 animate-spin text-orange-400" /> {/* ✅ same color */}
    </div>
  );
}
