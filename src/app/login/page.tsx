'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import oakridge from '../assets/oakridge.png';
import { supabase } from '../../../lib/supabase/client';

export default function Login() {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) r.replace('/admin');
    });
  }, [r]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      r.replace('/admin');
    } catch (e: unknown) {
      setErr(e instanceof Error? e.message: 'Login failed');
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="p-6 bg-[#151c2f] min-h-screen w-full flex flex-col items-center justify-center">
      <div className='pb-8 scale-80 md:scale-100'>
        <Image src={oakridge} alt="Grand Hyatt" placeholder="blur" width={300} />
      </div>

      <div className="shadow-xl w-[80%] md:w-[30%] lg:w-[35%] xl:w-[25%] bg-[#212e3f] p-4 md:p-8 rounded-xl">
        <form onSubmit={onSubmit} className="flex text-white flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm" htmlFor="email">Email</label>
            <input
              name="email"
              id="email"
              required
              autoComplete="email"
              className="rounded-lg bg-[#151c2f] focus:outline-none border border-[#151c2f] focus:border-blue-500 p-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm" htmlFor="password">Password</label>
            <input
              name="password"
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-lg bg-[#151c2f] focus:outline-none border border-[#151c2f] focus:border-blue-500 p-2"
            />
          </div>

          <div className="w-full flex justify-end items-center gap-x-2">
            <button
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 p-2 text-sm cursor-pointer disabled:opacity-60"
            >
              {/* {loading ? '...' : 'Log in'} */}
              {loading ? (
                <span className="inline-flex items-center px-3 gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 004 12z" />
                  </svg>
                </span>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>

        {err && <p className="text-red-400 text-sm mt-3">{err}</p>}
      </div>
    </main>
  );
}
