import { useEffect, useState } from 'react'
import { X, Users, UserPlus, UserMinus, LoaderCircle } from 'lucide-react'
import api from '../services/api'

function GroupMembers({ channel, token, canManage, onClose }) {
  const [members, setMembers] = useState([])
  const [availableMembers, setAvailableMembers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(
        `/channels/${channel.id}`,
        authConfig
      )

      setMembers(response.data.members || [])

      if (canManage) {
        const availableResponse = await api.get(
          `/channels/${channel.id}/available-members`,
          authConfig
        )

        setAvailableMembers(availableResponse.data || [])
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Impossible de récupérer les participants.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [channel.id])

  const handleAddMember = async () => {
    if (!selectedUserId) return

    try {
      setAdding(true)
      setError('')
      setSuccess('')

      await api.post(
        `/channels/${channel.id}/members`,
        {
          user_id: Number(selectedUserId),
          role: 'MEMBER',
        },
        authConfig
      )

      setSelectedUserId('')
      setSuccess('Le membre a été ajouté avec succès.')

      await loadMembers()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Impossible d'ajouter ce membre."
      )
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment retirer ce membre du groupe ?')) {
      return
    }

    try {
      setRemovingId(userId)
      setError('')
      setSuccess('')

      await api.delete(
        `/channels/${channel.id}/members/${userId}`,
        authConfig
      )

      setSuccess('Le membre a été retiré du groupe.')

      await loadMembers()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Impossible de retirer ce membre.'
      )
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* EN-TÊTE */}
        <div className="flex items-center justify-between p-5 border-b">

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Participants
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {channel.name} · {members.length} membre(s)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={20} />
          </button>

        </div>

        {/* CONTENU */}
        <div className="p-5 overflow-y-auto">

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
              {success}
            </div>
          )}

          {/* AJOUT D'UN MEMBRE */}
          {canManage && (

            <div className="mb-6 p-4 bg-blue-50 rounded-xl">

              <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
                <UserPlus size={17} className="text-blue-700" />
                Ajouter un participant
              </h3>

              <div className="flex gap-2">

                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-blue-600"
                >
                  <option value="">
                    Choisir un membre...
                  </option>

                  {availableMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.email})
                    </option>
                  ))}

                </select>

                <button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || adding}
                  className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {adding ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <UserPlus size={16} />
                  )}

                  Ajouter
                </button>

              </div>

              {availableMembers.length === 0 && !loading && (
                <p className="text-xs text-slate-500 mt-2">
                  Aucun autre membre disponible.
                </p>
              )}

            </div>

          )}

          {/* LISTE DES PARTICIPANTS */}
          <div>

            <h3 className="font-semibold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Users size={17} />
              Liste des participants
            </h3>

            {loading ? (

              <div className="flex justify-center py-8">
                <LoaderCircle className="animate-spin text-blue-700" />
              </div>

            ) : members.length === 0 ? (

              <p className="text-sm text-slate-400 text-center py-6">
                Aucun participant trouvé.
              </p>

            ) : (

              <div className="space-y-2">

                {members.map((member) => {

                  const person = member.user

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100"
                    >

                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {person?.first_name?.charAt(0)}
                        {person?.last_name?.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">

                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {person?.first_name} {person?.last_name}
                        </p>

                        <p className="text-xs text-slate-400 truncate">
                          {person?.email}
                        </p>

                      </div>

                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                        member.role === 'OWNER'
                          ? 'bg-amber-50 text-amber-700'
                          : member.role === 'MODERATOR'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {member.role === 'OWNER'
                          ? 'Propriétaire'
                          : member.role === 'MODERATOR'
                          ? 'Modérateur'
                          : 'Membre'}
                      </span>

                      {canManage && member.role !== 'OWNER' && (

                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={removingId === member.user_id}
                          title="Retirer ce membre"
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          {removingId === member.user_id ? (
                            <LoaderCircle size={17} className="animate-spin" />
                          ) : (
                            <UserMinus size={17} />
                          )}
                        </button>

                      )}

                    </div>
                  )
                })}

              </div>

            )}

          </div>

        </div>

        {/* PIED */}
        <div className="p-4 border-t flex justify-end">

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold"
          >
            Fermer
          </button>

        </div>

      </div>

    </div>
  )
}

export default GroupMembers