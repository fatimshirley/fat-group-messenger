import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import {
  LockKeyhole,
  MessagesSquare,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
} from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err.response?.data?.detail

      setError(
        typeof message === 'string'
          ? message
          : 'Impossible de vous connecter. Vérifiez vos identifiants.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-100 flex items-center justify-center p-3 sm:p-5">

      <div className="w-full max-w-6xl min-h-[calc(100vh-1.5rem)] lg:min-h-0 lg:h-full lg:max-h-[760px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">

        {/* PANNEAU GAUCHE : VISIBLE UNIQUEMENT SUR ORDINATEUR */}
        <div className="hidden lg:flex bg-slate-950 text-white p-7 flex-col justify-between">

          <div>

            <div className="flex items-center justify-between mb-6">

              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-2 text-xs text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Espace sécurisé d'entreprise
              </span>

              <span className="text-slate-400 text-xs">
                v1.0.0
              </span>

            </div>

            <div className="flex items-center gap-4 mb-5">

              <img
                src="/logo.png"
                alt="Logo Fat Group"
                className="w-14 h-14 object-contain rounded-lg bg-white p-1"
              />

              <div>

                <h1 className="text-2xl font-bold tracking-tight">
                  FAT GROUP
                </h1>

                <p className="text-blue-300 text-sm font-semibold tracking-[3px]">
                  MESSENGER
                </p>

              </div>

            </div>

            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              La plateforme collaborative de votre organisation.
              Communiquez, partagez et travaillez ensemble dans un espace
              réservé aux membres de Fat Group.
            </p>

            <div className="h-px bg-white/15 my-5" />

            <div className="space-y-4">

              <Feature
                icon={<LockKeyhole size={19} />}
                title="Communications sécurisées"
                description="Un espace privé réservé aux membres de votre organisation."
              />

              <Feature
                icon={<MessagesSquare size={19} />}
                title="Salons de discussion"
                description="Des espaces organisés par département et des conversations privées."
              />

              <Feature
                icon={<ShieldCheck size={19} />}
                title="Collaboration"
                description="Retrouvez vos collègues et échangez au sein de votre organisation."
              />

            </div>

          </div>

          <div className="border-t border-white/15 pt-4 mt-5 flex justify-between items-center text-slate-400 text-xs">

            <span>Fat Group Messenger</span>
            <span>Plateforme interne</span>

          </div>

        </div>

        {/* PANNEAU DROIT : FORMULAIRE */}
        <div className="flex flex-col justify-center p-5 sm:p-8 lg:px-10">

          <div className="max-w-lg w-full mx-auto">

            {/* IDENTITÉ DE L'ENTREPRISE */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">

              <div className="flex items-center gap-3">

                <img
                  src="/logo.png"
                  alt="Logo Fat Group"
                  className="w-11 h-11 object-contain rounded-lg border border-slate-200 p-1"
                />

                <div>

                  <h2 className="font-semibold text-slate-900">
                    Fat Group
                  </h2>

                  <p className="text-xs text-slate-500">
                    Espace collaboratif
                  </p>

                </div>

              </div>

              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                Accès sécurisé
              </span>

            </div>

            {/* TITRE */}
            <div className="mb-4">

              <h2 className="text-2xl font-bold text-slate-900">
                Bienvenue !
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Connectez-vous à votre espace de travail.
              </p>

            </div>

            {/* INFORMATION */}
            <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">

              <Info
                className="text-blue-700 shrink-0 mt-0.5"
                size={19}
              />

              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Accès réservé :</strong> la création des comptes
                est exclusivement assurée par l'administrateur.
              </p>

            </div>

            {/* MESSAGE D'ERREUR */}
            {error && (

              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm"
              >
                {error}
              </div>

            )}

            {/* FORMULAIRE */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* EMAIL */}
              <div>

                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Adresse e-mail professionnelle
                </label>

                <div className="relative">

                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@fatgroup.com"
                    required
                    autoComplete="username"
                    disabled={isSubmitting}
                    className="w-full pl-11 pr-4 py-3 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:bg-slate-100"
                  />

                </div>

              </div>

              {/* MOT DE PASSE */}
              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Mot de passe
                </label>

                <div className="relative">

                  <LockKeyhole
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    required
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="w-full pl-11 pr-12 py-3 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              {/* BOUTON DE CONNEXION */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
              >

                {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}

                {!isSubmitting && <ArrowRight size={19} />}

              </button>

            </form>

            {/* PIED DE PAGE */}
            <div className="border-t border-slate-200 mt-5 pt-4">

              <p className="text-center text-xs text-slate-500 leading-relaxed">
                <ShieldCheck size={15} className="inline mr-2 text-blue-700" />
                Accès réservé aux membres autorisés de Fat Group.
              </p>

              <p className="text-center text-xs text-slate-400 mt-2">
                Première connexion ? Contactez votre administrateur.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

function Feature({ icon, title, description }) {

  return (

    <div className="flex gap-3">

      <div className="w-10 h-10 shrink-0 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-blue-300">
        {icon}
      </div>

      <div>

        <h3 className="font-semibold text-sm mb-1">
          {title}
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed">
          {description}
        </p>

      </div>

    </div>

  )

}

export default Login