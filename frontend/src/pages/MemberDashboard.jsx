import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessagesSquare,
  Plus,
  LogOut,
  Hash,
  Send,
  Search,
  Menu,
  X,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import GroupInvitations from '../components/GroupInvitations'
import GroupMembers from '../components/GroupMembers'

function MemberDashboard() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()

  const [channels, setChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageContent, setMessageContent] = useState('')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [creating, setCreating] = useState(false)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showInvitations, setShowInvitations] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  const [channelDetails, setChannelDetails] = useState(null)

  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState('')
  const [socketConnected, setSocketConnected] = useState(false)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }

  // =====================================================
  // RÉCUPÉRATION DES SALONS ET GROUPES
  // =====================================================

  const fetchChannels = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/channels/', authConfig)

      setChannels(response.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Impossible de récupérer les salons.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  // =====================================================
  // RÉCUPÉRATION DES DÉTAILS ET PARTICIPANTS DU GROUPE
  // =====================================================

  useEffect(() => {
    if (!selectedChannel?.id || !token) {
      setChannelDetails(null)
      return
    }

    if (selectedChannel.type !== 'GROUP') {
      setChannelDetails(null)
      return
    }

    let active = true

    setChannelDetails(null)

    const fetchChannelDetails = async () => {
      try {
        const response = await api.get(
          `/channels/${selectedChannel.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (active) {
          setChannelDetails(response.data)
        }
      } catch (err) {
        console.error(
          'Erreur de récupération des participants :',
          err.response?.data || err.message
        )

        if (active) {
          setChannelDetails(null)
        }
      }
    }

    fetchChannelDetails()

    return () => {
      active = false
    }
  }, [selectedChannel?.id, token])

  // =====================================================
  // HISTORIQUE DES MESSAGES ET CONNEXION WEBSOCKET
  // =====================================================

  useEffect(() => {
    if (!selectedChannel?.id || !token) {
      setSocketConnected(false)
      return
    }

    let active = true

    setSocketConnected(false)
    setMessages([])
    setMessageContent('')
    setError('')

    // Chargement de l'historique
    const loadConversation = async () => {
      try {
        const response = await api.get(
          `/messages/channel/${selectedChannel.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (active) {
          const orderedMessages = [...response.data].sort(
            (a, b) =>
              new Date(a.created_at) - new Date(b.created_at)
          )

          setMessages(orderedMessages)
        }
      } catch (err) {
        console.error(
          'Erreur de récupération des messages :',
          err.response?.data || err.message
        )

        if (active) {
          setMessages([])
          setError(
            err.response?.data?.detail ||
            "Impossible de récupérer l'historique des messages."
          )
        }
      }
    }

    loadConversation()

    // Construction de l'adresse WebSocket
    const apiUrl = (
      import.meta.env.VITE_API_URL ||
      'http://127.0.0.1:8000'
    ).replace(/\/$/, '')

    let wsUrl

    try {
      const url = new URL(apiUrl)

      url.protocol =
        url.protocol === 'https:' ? 'wss:' : 'ws:'

      url.pathname = `${url.pathname.replace(/\/$/, '')}/ws/channels/${selectedChannel.id}`

      url.search = ''
      url.searchParams.set('token', token)

      wsUrl = url.toString()

    } catch (err) {
      console.error(
        'Adresse WebSocket invalide :',
        err
      )

      setError("L'adresse du serveur est invalide.")
      return
    }

    console.log(
      'Connexion WebSocket :',
      `${wsUrl.split('?')[0]}`
    )

    // Création de la connexion
    const socket = new WebSocket(wsUrl)

    socketRef.current = socket

    // Connexion réussie
    socket.onopen = () => {
      if (!active) return

      console.log('WebSocket connecté.')

      setSocketConnected(true)
      setError('')
    }

    // Réception des messages
    socket.onmessage = (event) => {
      if (!active) return

      try {
        const data = JSON.parse(event.data)

        console.log('Message WebSocket reçu :', data)

        if (data.event === 'new_message') {
          setMessages((previous) => {
            const alreadyExists = previous.some(
              (message) => message.id === data.id
            )

            if (alreadyExists) {
              return previous
            }

            return [...previous, data]
          })
        }

        if (data.event === 'error') {
          setError(
            data.detail ||
            "Une erreur est survenue lors de l'envoi."
          )
        }

      } catch (err) {
        console.error(
          'Erreur de réception du message :',
          err
        )
      }
    }

    // Fermeture de la connexion
    socket.onclose = (event) => {
      console.error(
        'WebSocket fermé :',
        event.code,
        event.reason
      )

      if (!active) return

      setSocketConnected(false)

      if (event.code === 4401) {
        setError(
          'Votre session est invalide ou expirée. Reconnectez-vous.'
        )
      } else if (event.code === 4403) {
        setError(
          "Vous n'avez pas accès à ce salon."
        )
      } else if (event.code === 1006) {
        setError(
          'Impossible de joindre le serveur de messagerie.'
        )
      } else if (event.code !== 1000) {
        setError(
          `Connexion interrompue (code ${event.code}).`
        )
      }
    }

    // Erreur de connexion
    socket.onerror = (event) => {
      console.error(
        'Erreur WebSocket :',
        event
      )

      if (active) {
        setSocketConnected(false)
      }
    }

    // Nettoyage lors du changement de salon
    return () => {
      active = false

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close(1000, 'Changement de salon')
      }

      if (socketRef.current === socket) {
        socketRef.current = null
      }

      setSocketConnected(false)
    }

  }, [selectedChannel?.id, token])

  // =====================================================
  // DÉFILEMENT AUTOMATIQUE
  // =====================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  // =====================================================
  // CRÉATION D'UN GROUPE
  // =====================================================

  const handleCreateGroup = async (e) => {
    e.preventDefault()

    if (groupName.trim().length < 2) return

    try {
      setCreating(true)
      setError('')

      const response = await api.post(
        '/channels/',
        {
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          type: 'GROUP',
        },
        authConfig
      )

      setChannels((previous) => [
        response.data,
        ...previous,
      ])

      setSelectedChannel(response.data)

      setGroupName('')
      setGroupDescription('')
      setShowCreateForm(false)
      setSidebarOpen(false)

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Impossible de créer le groupe.'
      )
    } finally {
      setCreating(false)
    }
  }

  // =====================================================
  // ENVOI D'UN MESSAGE
  // =====================================================

  const handleSendMessage = (e) => {
    e.preventDefault()

    const content = messageContent.trim()

    if (!content || !selectedChannel || sending) {
      return
    }

    const socket = socketRef.current

    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      setSocketConnected(false)

      setError(
        'Connexion au salon indisponible. Patientez quelques instants.'
      )

      return
    }

    try {
      setSending(true)
      setError('')

      socket.send(
        JSON.stringify({
          content: content,
        })
      )

      setMessageContent('')

    } catch (err) {
      console.error(
        "Erreur lors de l'envoi :",
        err
      )

      setError(
        "Impossible d'envoyer le message. Réessayez."
      )

    } finally {
      setSending(false)
    }
  }

  // =====================================================
  // DÉCONNEXION
  // =====================================================

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    logout()

    navigate('/login', {
      replace: true,
    })
  }

  // =====================================================
  // RECHERCHE DES SALONS
  // =====================================================

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(
      search.toLowerCase()
    )
  )

  const officialChannels = filteredChannels.filter(
    (channel) => channel.type === 'OFFICIAL'
  )

  const groups = filteredChannels.filter(
    (channel) => channel.type === 'GROUP'
  )

  // =====================================================
  // VÉRIFICATION DU PROPRIÉTAIRE
  // =====================================================

  const isGroupOwner =
    selectedChannel?.type === 'GROUP' &&
    channelDetails?.members?.some(
      (member) =>
        Number(member.user_id) === Number(user?.id) &&
        member.role === 'OWNER'
    )

  // =====================================================
  // FORMATAGE DE L'HEURE
  // =====================================================

  const formatTime = (date) => {
    if (!date) return ''

    return new Date(date).toLocaleTimeString(
      'fr-FR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <div className="h-screen flex bg-slate-100 text-slate-800 overflow-hidden">

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-white border-r border-slate-200 flex flex-col transition-transform ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >

        {/* LOGO */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-200">

          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Fat Group"
              className="w-11 h-11 object-contain rounded-lg border border-slate-200 p-1"
            />

            <div>
              <h1 className="font-bold text-slate-900">
                FAT GROUP
              </h1>

              <p className="text-[10px] text-blue-700 font-semibold tracking-[2px]">
                MESSENGER
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500"
          >
            <X size={21} />
          </button>

        </div>

        {/* RECHERCHE */}
        <div className="p-4 border-b border-slate-100">

          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-3">

            <Search
              size={17}
              className="text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un salon..."
              className="bg-transparent outline-none text-sm w-full"
            />

          </div>
        </div>

        {/* LISTE DES SALONS */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* SALONS OFFICIELS */}
          <div className="flex items-center justify-between mb-3">

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Salons officiels
            </p>

            <ShieldCheck
              size={15}
              className="text-blue-600"
            />

          </div>

          <div className="space-y-1">

            {officialChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                selected={selectedChannel?.id === channel.id}
                onClick={() => {
                  setSelectedChannel(channel)
                  setSidebarOpen(false)
                }}
              />
            ))}

            {!loading && officialChannels.length === 0 && (
              <p className="text-xs text-slate-400 px-3 py-3">
                Aucun salon officiel.
              </p>
            )}

          </div>

          {/* GROUPES */}
          <div className="mt-8">

            <div className="flex items-center justify-between mb-3">

              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Mes groupes
              </p>

              <button
                onClick={() => setShowCreateForm(true)}
                className="text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg"
                title="Créer un groupe"
              >
                <Plus size={18} />
              </button>

            </div>

            <div className="space-y-1">

              {groups.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  selected={selectedChannel?.id === channel.id}
                  onClick={() => {
                    setSelectedChannel(channel)
                    setSidebarOpen(false)
                  }}
                />
              ))}

              {!loading && groups.length === 0 && (
                <p className="text-xs text-slate-400 px-3 py-3">
                  Vous ne participez à aucun groupe.
                </p>
              )}

            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 border border-dashed border-blue-300 text-blue-700 rounded-lg p-3 text-xs font-semibold hover:bg-blue-50 transition"
            >
              <Plus size={16} />
              Créer un groupe
            </button>

          </div>
        </div>

        {/* PROFIL */}
        <div className="p-4 border-t border-slate-200">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
              {user?.first_name?.charAt(0)}
              {user?.last_name?.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">

              <p className="text-sm font-semibold truncate">
                {user?.first_name} {user?.last_name}
              </p>

              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>

            </div>

            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="text-slate-400 hover:text-red-600"
            >
              <LogOut size={19} />
            </button>

          </div>

          <div className="mt-3">
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
              Membre
            </span>
          </div>

        </div>
      </aside>

      {/* FOND MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
        />
      )}

      {/* CONVERSATION */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">

          <div className="flex items-center gap-3 min-w-0">

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600"
            >
              <Menu size={23} />
            </button>

            {selectedChannel ? (
              <>

                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">

                  {selectedChannel.type === 'OFFICIAL' ? (
                    <ShieldCheck size={21} />
                  ) : (
                    <Hash size={21} />
                  )}

                </div>

                <div className="min-w-0">

                  <h2 className="font-bold text-slate-900 truncate">
                    {selectedChannel.name}
                  </h2>

                  <p className="text-xs text-slate-400">
                    {selectedChannel.type === 'OFFICIAL'
                      ? 'Salon officiel'
                      : 'Groupe de discussion'}
                  </p>

                </div>

              </>
            ) : (

              <div>

                <h2 className="font-bold text-slate-900">
                  Messagerie
                </h2>

                <p className="text-xs text-slate-400">
                  Espace collaboratif Fat Group
                </p>

              </div>

            )}

          </div>

          {selectedChannel && (

            <div className="flex items-center gap-3 shrink-0">

              {/* PARTICIPANTS */}
              {selectedChannel.type === 'GROUP' && (

                <button
                  onClick={() => setShowMembers(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                  title="Voir les participants"
                >

                  <Users size={17} />

                  <span className="hidden sm:inline">
                    Participants
                  </span>

                </button>

              )}

              {/* INVITATIONS */}
              {isGroupOwner && (

                <button
                  onClick={() => setShowInvitations(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                  title="Inviter des membres"
                >

                  <UserPlus size={17} />

                  <span className="hidden sm:inline">
                    Inviter
                  </span>

                </button>

              )}

              {/* STATUT WEBSOCKET */}
              <div className="flex items-center gap-2 text-xs">

                <span
                  className={`w-2 h-2 rounded-full ${
                    socketConnected
                      ? 'bg-emerald-500'
                      : 'bg-red-400'
                  }`}
                />

                <span className="text-slate-500 hidden sm:block">

                  {socketConnected
                    ? 'Connecté'
                    : 'Déconnecté'}

                </span>

              </div>

            </div>

          )}

        </header>

        {/* ERREUR */}
        {error && (

          <div className="mx-4 mt-3 p-3 bg-red-50 text-red-700 border border-red-100 rounded-lg text-sm">

            {error}

            <button
              onClick={() => setError('')}
              className="float-right font-bold"
            >
              ×
            </button>

          </div>

        )}

        {/* CONTENU */}
        {!selectedChannel ? (

          <div className="flex-1 flex items-center justify-center p-6">

            <div className="max-w-md text-center">

              <div className="w-20 h-20 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <MessagesSquare size={35} />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Bienvenue dans votre messagerie
              </h2>

              <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                Sélectionnez un salon dans le menu pour consulter les
                conversations et échanger avec vos collègues.
              </p>

              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-6 inline-flex items-center gap-2 bg-blue-700 text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-blue-800"
              >
                <Plus size={18} />
                Créer un groupe
              </button>

            </div>

          </div>

        ) : (

          <>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

              {messages.length === 0 ? (

                <div className="h-full flex flex-col items-center justify-center text-center">

                  <MessageCircle
                    size={35}
                    className="text-slate-300 mb-3"
                  />

                  <p className="font-semibold text-slate-600">
                    Aucun message pour le moment
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    Soyez le premier à envoyer un message.
                  </p>

                </div>

              ) : (

                messages.map((message, index) => {

                  const isMine =
                    Number(message.sender_id) === Number(user?.id)

                  return (

                    <div
                      key={message.id || index}
                      className={`flex ${
                        isMine
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >

                      <div
                        className={`max-w-[85%] sm:max-w-[70%] ${
                          isMine
                            ? 'bg-blue-700 text-white rounded-2xl rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-sm'
                        } px-4 py-3 shadow-sm`}
                      >

                        {!isMine && (

                          <p className="text-[11px] font-bold text-blue-700 mb-1">
                            {message.sender_name ||
                              `Membre #${message.sender_id}`}
                          </p>

                        )}

                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>

                        <p
                          className={`text-[10px] text-right mt-2 ${
                            isMine
                              ? 'text-blue-100'
                              : 'text-slate-400'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>

                      </div>

                    </div>

                  )

                })

              )}

              <div ref={messagesEndRef} />

            </div>

            {/* COMPOSER */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 sm:px-6 bg-white border-t border-slate-200"
            >

              <div className="flex items-center gap-3 max-w-5xl mx-auto">

                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Écrire un message..."
                  maxLength={10000}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={
                    !messageContent.trim() ||
                    sending ||
                    !socketConnected
                  }
                  className="w-12 h-12 flex items-center justify-center bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl transition"
                  title={
                    socketConnected
                      ? 'Envoyer'
                      : 'En attente de connexion'
                  }
                >

                  {sending ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={19} />
                  )}

                </button>

              </div>

            </form>

          </>

        )}

      </main>

      {/* MODALE CRÉATION GROUPE */}
      {showCreateForm && (

        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">

          <form
            onSubmit={handleCreateGroup}
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl"
          >

            <div className="flex items-center justify-between mb-5">

              <div>

                <h2 className="text-lg font-bold text-slate-900">
                  Créer un groupe
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Créez un espace de discussion avec vos collègues.
                </p>

              </div>

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={21} />
              </button>

            </div>

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Nom du groupe
            </label>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Exemple : Projet informatique"
              minLength={2}
              maxLength={150}
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-600 mb-4"
            />

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description (facultative)
            </label>

            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Décrivez l'objectif du groupe..."
              maxLength={1000}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-600 resize-none"
            />

            <div className="flex justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  creating ||
                  groupName.trim().length < 2
                }
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              >

                {creating && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                Créer le groupe

              </button>

            </div>

          </form>

        </div>

      )}

      {/* MODALE INVITATIONS */}
      {showInvitations && selectedChannel && (

        <GroupInvitations
          channel={selectedChannel}
          token={token}
          onClose={() => setShowInvitations(false)}
        />

      )}

      {/* MODALE PARTICIPANTS */}
      {showMembers && selectedChannel && (

        <GroupMembers
          channel={selectedChannel}
          token={token}
          canManage={Boolean(isGroupOwner)}
          onClose={() => setShowMembers(false)}
        />

      )}

    </div>
  )
}


// =====================================================
// COMPOSANT D'AFFICHAGE D'UN SALON
// =====================================================

function ChannelItem({ channel, selected, onClick }) {

  return (

    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition ${
        selected
          ? 'bg-blue-50 text-blue-700 border border-blue-100'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >

      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
          selected
            ? 'bg-white'
            : 'bg-slate-100'
        }`}
      >

        {channel.type === 'OFFICIAL' ? (
          <ShieldCheck size={18} />
        ) : (
          <Hash size={18} />
        )}

      </div>

      <div className="flex-1 min-w-0">

        <p className="text-sm font-semibold truncate">
          {channel.name}
        </p>

        <p className="text-[10px] text-slate-400">
          {channel.type === 'OFFICIAL'
            ? 'Officiel'
            : 'Groupe'}
        </p>

      </div>

    </button>

  )
}

export default MemberDashboard