import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Users,
  Mail,
  ShieldCheck,
  UserCheck,
  UserX,
  Pencil,
  X,
  RefreshCw,
  LoaderCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
}

function UsersPage() {
  const { user, token } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  const loadUsers = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/users/', authConfig)
      setUsers(response.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Impossible de récupérer la liste des membres.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadUsers()
    }
  }, [token])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return users

    return users.filter((member) => {
      const fullName =
        `${member.first_name} ${member.last_name}`.toLowerCase()

      return (
        fullName.includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
      )
    })
  }, [users, search])

  const membersCount = users.filter(
    (member) => member.role === 'MEMBER'
  ).length

  const activeCount = users.filter(
    (member) => member.is_active
  ).length

  const inactiveCount = users.filter(
    (member) => !member.is_active
  ).length

  const openCreateModal = () => {
    setEditingUser(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const openEditModal = (member) => {
    setEditingUser(member)
    setForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      password: '',
    })
    setError('')
    setSuccess('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return

    setModalOpen(false)
    setEditingUser(null)
    setForm(initialForm)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    if (!editingUser && form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setSubmitting(true)

    try {
      if (editingUser) {
        const payload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
        }

        const response = await api.patch(
          `/users/${editingUser.id}`,
          payload,
          authConfig
        )

        setUsers((previous) =>
          previous.map((member) =>
            member.id === editingUser.id ? response.data : member
          )
        )

        setSuccess('Les informations du membre ont été modifiées.')
      } else {
        const payload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          password: form.password,
        }

        const response = await api.post('/users/', payload, authConfig)

        setUsers((previous) => [...previous, response.data])

        setSuccess('Le membre a été créé avec succès.')
      }

      setModalOpen(false)
      setEditingUser(null)
      setForm(initialForm)
    } catch (err) {
      const detail = err.response?.data?.detail

      setError(
        Array.isArray(detail)
          ? detail.map((item) => item.msg).join(' ')
          : detail || 'Une erreur est survenue. Veuillez réessayer.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const toggleUserStatus = async (member) => {
    const action = member.is_active ? 'désactiver' : 'activer'

    if (!window.confirm(`Voulez-vous vraiment ${action} ce compte ?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      const response = await api.patch(
        `/users/${member.id}`,
        { is_active: !member.is_active },
        authConfig
      )

      setUsers((previous) =>
        previous.map((item) =>
          item.id === member.id ? response.data : item
        )
      )

      setSuccess(
        member.is_active
          ? 'Le compte a été désactivé.'
          : 'Le compte a été activé.'
      )
    } catch (err) {
      const detail = err.response?.data?.detail

      setError(
        typeof detail === 'string'
          ? detail
          : 'Impossible de modifier le statut de ce compte.'
      )
    }
  }

  return (
    <div className="space-y-6">

      {/* EN-TÊTE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Gestion des membres
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez les comptes et les accès des collaborateurs.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          <Plus size={18} />
          Ajouter un membre
        </button>
      </div>

      {/* MESSAGES */}
      {error && !modalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total des comptes"
          value={users.length}
          icon={Users}
        />
        <StatCard
          title="Comptes actifs"
          value={activeCount}
          icon={UserCheck}
        />
        <StatCard
          title="Comptes inactifs"
          value={inactiveCount}
          icon={UserX}
        />
      </div>

      {/* LISTE */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900">
              Liste des utilisateurs
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {membersCount} membre(s) enregistré(s)
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 flex-1 sm:w-72">
              <Search size={17} className="text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un membre..."
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            <button
              onClick={loadUsers}
              disabled={loading}
              title="Actualiser"
              className="border border-slate-200 rounded-lg px-3 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Chargement des membres...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">
              Aucun utilisateur trouvé
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {search
                ? 'Essayez avec un autre nom ou une autre adresse e-mail.'
                : 'Aucun compte utilisateur n’est encore enregistré.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="px-5 py-4 font-semibold">Utilisateur</th>
                  <th className="px-5 py-4 font-semibold">Rôle</th>
                  <th className="px-5 py-4 font-semibold">Statut</th>
                  <th className="px-5 py-4 font-semibold">Inscription</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-52">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                          {member.first_name?.charAt(0)?.toUpperCase()}
                          {member.last_name?.charAt(0)?.toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Mail size={12} />
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-600">
                        {member.role === 'ADMIN' && <ShieldCheck size={13} />}
                        {member.role === 'ADMIN' ? 'Administrateur' : 'Membre'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        member.is_active ? 'text-green-700' : 'text-red-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          member.is_active ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        {member.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          title="Modifier"
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => toggleUserStatus(member)}
                          disabled={member.id === user?.id}
                          title={
                            member.id === user?.id
                              ? 'Vous ne pouvez pas modifier votre propre statut.'
                              : member.is_active ? 'Désactiver' : 'Activer'
                          }
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {member.is_active
                            ? <UserX size={17} />
                            : <UserCheck size={17} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODALE */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/50 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-slate-900">
                  {editingUser ? 'Modifier un membre' : 'Ajouter un membre'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {editingUser
                    ? 'Modifiez les informations du compte.'
                    : 'Créez un nouveau compte collaborateur.'}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Fermer"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Prénom"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                />

                <FormField
                  label="Nom"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>

              <FormField
                label="Adresse e-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />

              {!editingUser && (
                <FormField
                  label="Mot de passe provisoire"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                />
              )}

              {!editingUser && (
                <p className="text-xs text-slate-400">
                  Le compte sera créé avec le rôle Membre.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting && <LoaderCircle size={16} className="animate-spin" />}
                  {editingUser ? 'Enregistrer' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
          <Icon size={20} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-4">{value}</p>
    </div>
  )
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  minLength,
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        minLength={minLength}
        required
        className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

export default UsersPage