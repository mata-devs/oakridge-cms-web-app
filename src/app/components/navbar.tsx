'use client';

import Link from 'next/link';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import oakridge from '../assets/oakridge2.png';
import { usePathname } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';

type Role = 'admin' | 'editor' | 'super-admin';

export default function NavBar({ role = 'editor' }: { role?: Role }) {
  // const r = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function logout() {
    try {
      setLoggingOut(true);

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('auth') || name.includes('session') || name.includes('supabase')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }
      
      supabase.auth.signOut().catch(() => {});
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } finally {
      window.location.replace('/login');
    }
  }

  const isRoleSuperAdminOrAdmin = role === 'super-admin' || role === 'admin';

  return (
    <nav
      className={`sticky top-0 z-50 bg-[#212e3f] text-white transition-colors
        ${isScrolled ? 'bg-opacity-90 backdrop-blur-md' : ''}`}
    >
      <div className="mx-auto  px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src={oakridge} alt="Oakridge" priority width={100} />
        </Link>
          {/* <span className='tracking-wide w-full'>
            OAKRIDGE
          </span> */}

        {/* Desktop ni */}
        <ul className="hidden md:flex items-center gap-4 font-[family-name:var(--font-geist-sans)]">
          <li>
            <Link
              href="/admin"
              className="rounded-md border-2 border-transparent px-3 py-2 hover:border-blue-500 transition"
            >
              Pop-up Content
            </Link>
          </li>
          {/* <li>
            <Link
              href="/admin/content"
              className="rounded-md border-2 border-transparent px-3 py-2 hover:border-blue-500 transition"
            >
              Oakridge Content
            </Link>
          </li> */}
          {/* <li>
            <Link
              href="/admin/seasons"
              className="rounded-md border-2 border-transparent px-3 py-2 hover:border-blue-500 transition"
            >
              Seasons
            </Link>
          </li> */}
          {isRoleSuperAdminOrAdmin && (
            <li>
              <Link 
                href="/admin/users" 
                className="rounded-md border-2 border-transparent px-3 py-2 hover:border-blue-500"
              >
                Users
              </Link>
            </li>
          )}
          <li>
            <button
              onClick={async () => {
                if (loggingOut) return;       
                setLoggingOut(true);
                try {
                  await logout();                 
                } finally {
                  setLoggingOut(false);
                }
              }}
              className="ml-2 rounded-lg bg-red-500 px-3 py-2 text-sm hover:opacity-95 hover:cursor-pointer"
            >
              {loggingOut ? (
                <span className="inline-flex items-center px-3 gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 004 12z" />
                  </svg>
                </span>
              ) : (
                'Logout'
              )}
            </button>
          </li>
        </ul>

        {/* Para mobile ni */}
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-white/10"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Open menu</span>
          {/* icons / X */}
          <svg
            className={`h-6 w-6 transition-transform ${open ? 'rotate-90 opacity-0' : 'opacity-100'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
          <svg
            className={`absolute h-6 w-6 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* menu overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
      />

      {/* panel */}
      <div
        className={`md:hidden absolute left-3 right-3 top-[72px] rounded-2xl border border-white/10 bg-[#212e3f] shadow-xl transition
          ${open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'}`}
      >
        <ul className="flex flex-col p-3 font-[family-name:var(--font-geist-sans)]">
          <li>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 hover:bg-white/10"
            >
              Pop-up Content
            </Link>
          </li>
          <li>
            <Link
              href="/admin/grandhyatt"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 hover:bg-white/10"
            >
              Grand Hyatt
            </Link>
          </li>
          <li>
            <Link
              href="/admin/seasons"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 hover:bg-white/10"
            >
              Seasons
            </Link>
          </li>
          {isRoleSuperAdminOrAdmin && (
            <li>
              <Link
                href="/admin/users"
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg白/10 hover:bg-white/10"
              >
                Users
              </Link>
            </li>
          )}
          <li className="mt-1 border-t border-white/10 pt-2">
            <button
              onClick={logout}
              className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm hover:opacity-95"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
