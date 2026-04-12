'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/types'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !data.user) {
      setError('Kayıt oluşturulamadı: ' + signUpError?.message)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        full_name: fullName,
        phone,
        role,
      })

    if (profileError) {
      setError('Profil oluşturulamadı.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm">
        
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Yeni Hesap</h1>
          <p className="text-sm text-gray-500 mt-1">DershaneOPS'a kayıt ol</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Ad Soyad" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com" required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="05xx xxx xxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="student">Öğrenci</option>
              <option value="teacher">Öğretmen</option>
              <option value="parent">Veli</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 karakter" required minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
            {loading ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Hesabın var mı?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Giriş yap</a>
        </p>
      </div>
    </div>
  )
}
