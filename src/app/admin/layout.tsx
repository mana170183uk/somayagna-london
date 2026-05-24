import Link from 'next/link';
import { LogoMark } from '@/components/ui/Logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-50">
      <header className="border-b border-gold-200 bg-ivory-50 sticky top-0 z-10">
        <div className="container-tight flex items-center justify-between py-3">
          <Link href="/admin" className="flex items-center gap-2 text-maroon-800">
            <LogoMark className="w-7 h-7 text-gold-500" />
            <span className="h-display text-lg">SomaYagna · Admin</span>
          </Link>
          <form action="/api/admin/logout" method="post">
            <button className="btn-ghost text-sm">Sign out</button>
          </form>
        </div>
      </header>
      <main className="container-tight py-8">{children}</main>
    </div>
  );
}
