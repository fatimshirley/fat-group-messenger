import { useState } from 'react'
import {
  Copy,
  Link2,
  X,
  LoaderCircle,
  Trash2,
  MessageCircle,
  Mail,
} from 'lucide-react'
import api from '../services/api'

function GroupInvitations({ channel, token, onClose }) {
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const headers = {
    Authorization: `Bearer ${token}`,
  }

  const invitationLink = invitation
    ? `${window.location.origin}/invite/${invitation.token}`
    : ''

  const createInvitation = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await api.post(
        `/invitations/channels/${channel.id}`,
        {
          expires_in_hours: 168,
          max_uses: 20,
        },
        { headers }
      )

      setInvitation(response.data)
      setSuccess('Lien d’invitation créé avec succès.')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Impossible de créer le lien d'invitation."
      )
    } finally {
      setLoading(false)
    }
  }

  const copyInvitation = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink)
      setSuccess('Lien copié ! Vous pouvez maintenant le partager.')
      setError('')
    } catch {
      setError(
        'Impossible de copier automatiquement. Sélectionnez le lien pour le copier.'
      )
    }
  }

  const shareWhatsApp = () => {
    const message = `Bonjour ! Je t'invite à rejoindre notre groupe "${channel.name}" sur Fat Group Messenger : ${invitationLink}`

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const shareEmail = () => {
    const subject = `Invitation au groupe ${channel.name}`
    const body = `Bonjour,\n\nJe t'invite à rejoindre notre groupe "${channel.name}" sur Fat Group Messenger.\n\nClique sur ce lien pour rejoindre le groupe :\n${invitationLink}\n\nÀ bientôt !`

    window.location.href =
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const revokeInvitation = async () => {
    if (!invitation) return

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await api.delete(
        `/invitations/${invitation.id}`,
        { headers }
      )

      setInvitation(null)
      setSuccess('Invitation révoquée avec succès.')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Impossible de révoquer l'invitation."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Inviter des membres
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Groupe : {channel.name}
            </p>
          </div>

          <button onClick={onClose}>
            <X size={21} className="text-slate-400" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
          <div className="flex gap-3">
            <Link2 className="text-blue-700 shrink-0" size={22} />

            <div>
              <p className="font-semibold text-sm text-slate-800">
                Lien d'invitation
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Le lien expire après 7 jours et permet jusqu'à 20 utilisations.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        {!invitation ? (
          <button
            onClick={createInvitation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg py-3 text-sm font-semibold"
          >
            {loading ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Link2 size={18} />
            )}

            Générer un lien
          </button>
        ) : (
          <>
            <div className="bg-slate-100 rounded-lg p-3 mb-4 break-all text-xs text-slate-600">
              {invitationLink}
            </div>

            <button
              onClick={copyInvitation}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-3 text-sm font-semibold mb-3"
            >
              <Copy size={17} />
              Copier le lien
            </button>

            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 text-sm font-semibold mb-3"
            >
              <MessageCircle size={17} />
              Partager sur WhatsApp
            </button>

            <button
              onClick={shareEmail}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg py-3 text-sm font-semibold mb-3"
            >
              <Mail size={17} />
              Partager par e-mail
            </button>

            <button
              onClick={revokeInvitation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg py-3 text-sm font-semibold"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Trash2 size={17} />
              )}

              Révoquer le lien
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm text-slate-500 hover:text-slate-800"
        >
          Fermer
        </button>

      </div>
    </div>
  )
}

export default GroupInvitations