import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, LoaderCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function AcceptInvitation() {
  const { token: invitationToken } = useParams()
  const { user, token, loading } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Vérification de votre invitation...')

  useEffect(() => {
    if (loading) return

    if (!user || !token) {
      setStatus('login')
      setMessage('Connectez-vous pour rejoindre ce groupe.')
      return
    }

    let active = true

    const accept = async () => {
      try {
        const response = await api.post(
          `/invitations/${invitationToken}/accept`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (active) {
          setStatus('success')
          setMessage(response.data.message)
        }
      } catch (error) {
        if (active) {
          setStatus('error')
          setMessage(
            error.response?.data?.detail ||
            "Impossible d'accepter cette invitation."
          )
        }
      }
    }

    accept()

    return () => {
      active = false
    }
  }, [loading, user, token, invitationToken])

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">

        {status === 'loading' && (
          <LoaderCircle
            size={45}
            className="mx-auto text-blue-700 animate-spin mb-5"
          />
        )}

        {status === 'success' && (
          <CheckCircle
            size={50}
            className="mx-auto text-emerald-500 mb-5"
          />
        )}

        {status === 'error' && (
          <AlertCircle
            size={50}
            className="mx-auto text-red-500 mb-5"
          />
        )}

        <h1 className="text-xl font-bold text-slate-900 mb-3">
          Invitation Fat Group
        </h1>

        <p className="text-sm text-slate-500 mb-6">
          {message}
        </p>

        {status === 'login' && (
          <Link
            to="/login"
            className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Se connecter
          </Link>
        )}

        {status === 'success' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Accéder à mes groupes
          </button>
        )}

        {(status === 'error') && (
          <Link
            to="/dashboard"
            className="inline-block bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-semibold"
          >
            Retour au dashboard
          </Link>
        )}

      </div>
    </div>
  )
}

export default AcceptInvitation