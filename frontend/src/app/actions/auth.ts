'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { error: 'Email dan password wajib diisi' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Login attempt result:', { session: !!data?.session, user: !!data?.user, error })

    if (error) {
      return { error: error.message }
    }

    if (!data.session) {
      return { error: 'Email belum diverifikasi. Jika Anda baru saja mematikan fitur Konfirmasi Email, Anda harus mendaftar (Register) ulang akun baru.' }
    }

  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan pada server saat menghubungkan ke database.' }
  }

  return { success: true }
}

export async function signUp(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!email || !password || !fullName) {
      return { error: 'Semua kolom wajib diisi' }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan pada server saat menghubungkan ke database.' }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
