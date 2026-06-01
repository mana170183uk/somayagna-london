import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminFromCookies } from '@/lib/auth';
import ChangePasswordForm from '@/components/admin/ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function AdminAccountPage() {
  const admin = await getAdminFromCookies();
  if (!admin) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-ivory-100">
      <header className="bg-gradient-to-b from-maroon-800 to-maroon-900 text-ivory-50 border-b border-gold-300/20">
        <div className="container-tight py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="eyebrow text-gold-200 mb-1">Account</p>
            <h1 className="h-display text-2xl md:text-3xl text-ivory-50">{admin.email}</h1>
            <p className="text-xs text-ivory-100/85 mt-1">Manage your sign-in credentials.</p>
          </div>
          <Link href="/admin" className="btn-ghost !text-ivory-100 hover:!bg-ivory-50/10">← Dashboard</Link>
        </div>
      </header>

      <main className="container-tight py-8">
        <div className="max-w-lg mx-auto card p-6">
          <h2 className="h-display text-xl text-maroon-800">Change password</h2>
          <p className="text-sm text-maroon-700/80 mt-1">
            Pick a new password — at least 10 characters, mixing letters, numbers and symbols. Both fields are typed only on this page; nothing is sent to chat or logged in plaintext.
          </p>
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}
