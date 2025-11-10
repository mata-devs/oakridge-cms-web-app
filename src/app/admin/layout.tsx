import { ReactNode } from 'react';
import { redirect, notFound } from 'next/navigation';
import NavBar from '../components/navbar';
import { createSupabaseAdmin } from '../../../lib/supabase/admin';
import { createSupabaseServer } from '../../../lib/supabase/server'
import { UserProvider } from '../providers/UserProviders';


export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = createSupabaseAdmin();
  const { count: profilesCount, error: profilesErr } = await admin
    .from('profiles')
    .select('id', { head: true, count: 'exact' });
  if (profilesErr) {
    console.log("error", profilesErr)
  }
  if ((profilesCount ?? 0) === 0) {
    console.log(profilesCount)
    redirect('/signup'); 
  }

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = (user.app_metadata as { role?: string })?.role ?? 'user';
  if (role !== 'super-admin' && role !== 'admin' && role !== 'editor') notFound();

  return (
    <>
      <NavBar role={role} />
      <UserProvider initialUser={user}>
      {children}
      </UserProvider>
    </>
  );
}
