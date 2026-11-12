import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UsersPage from './Users'


import {
  LayoutDashboard,
  MessagesSquare,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  Plus,
  Hash,
  ChevronRight,
  UserPlus,
  Menu,
  X,
  Activity,
  CalendarDays,
  CircleHelp,
  ShieldCheck,
  MessageCircle,
  MoreHorizontal,
} from 'lucide-react'

const navigation = [
  { name: 'Tableau de bord', icon: LayoutDashboard },
  { name: 'Messagerie', icon: MessagesSquare },
  { name: 'Membres', icon: Users },
]

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [activePage, setActivePage] = useState('Tableau de bord')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleNavigation = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
    setSearch('')
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">

      {/* MENU LATÉRAL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >

        {/* IDENTITÉ DE L'ENTREPRISE */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo Fat Group"
              className="w-11 h-11 object-contain rounded-lg border border-slate-200 p-1"
            />

            <div>
              <h1 className="font-bold text-slate-900 tracking-tight">
                FAT GROUP
              </h1>

              <p className="text-[10px] text-blue-700 font-semibold tracking-[2px]">
                MESSENGER
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-700"
            aria-label="Fermer le menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* NAVIGATION */}
        <div className="flex-1 overflow-y-auto px-4 py-6">

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">
            Menu principal
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.name

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              )
            })}
          </nav>

          {/* SALONS */}
          <div className="mt-9">
            <div className="flex items-center justify-between px-3 mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Salons de discussion
              </p>

              <button
                onClick={() => handleNavigation('Salons')}
                title="Gérer les salons"
                className="text-slate-400 hover:text-blue-700 transition"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="px-3 py-3 text-xs text-slate-400 leading-relaxed">
              Les salons seront affichés ici après leur récupération depuis le serveur.
            </div>
          </div>

          {/* ADMINISTRATION */}
          {isAdmin && (
            <div className="mt-9">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">
                Administration
              </p>

              <button
                onClick={() => handleNavigation('Paramètres')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition ${
                  activePage === 'Paramètres'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Settings size={19} />
                Paramètres
              </button>
            </div>
          )}

        </div>

        {/* PROFIL */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-semibold text-sm">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
              {user?.last_name?.charAt(0)?.toUpperCase() || ''}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.first_name} {user?.last_name}
              </p>

              <p className="text-xs text-slate-400 truncate">
                {user?.email}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-600 transition"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          </div>

          <div className="px-2 mt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
              <ShieldCheck size={12} />
              {isAdmin ? 'Administrateur' : 'Membre'}
            </span>
          </div>
        </div>

      </aside>

      {/* FOND MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 min-w-0">

        {/* BARRE SUPÉRIEURE */}
        <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-blue-700"
              aria-label="Ouvrir le menu"
            >
              <Menu size={23} />
            </button>

            <div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Fat Group / Espace collaboratif
              </p>

              <h2 className="font-bold text-slate-900 text-lg">
                {activePage}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2.5 w-64">
              <Search size={17} className="text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="bg-transparent outline-none text-sm ml-2 w-full placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              title="Notifications"
              className="relative w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              <Bell size={19} />
            </button>

            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-semibold">
                {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                {user?.last_name?.charAt(0)?.toUpperCase() || ''}
              </div>

              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-800">
                  {user?.first_name} {user?.last_name}
                </p>

                <p className="text-[10px] text-slate-400">
                  {isAdmin ? 'Administrateur' : 'Membre'}
                </p>
              </div>
            </div>

          </div>
        </header>

        {/* ZONE DE CONTENU */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">

          {activePage === 'Tableau de bord' && (
            <DashboardHome
              onNavigate={handleNavigation}
              search={search}
              user={user}
            />
          )}

          {activePage === 'Messagerie' && (
            <EmptyPage
              icon={MessagesSquare}
              title="Messagerie"
              description="Les conversations et les salons de discussion seront accessibles ici."
            />
          )}

          {activePage === 'Membres' && isAdmin && (
            <UsersPage />
         )}
         
          {activePage === 'Salons' && (
            <EmptyPage
              icon={Hash}
              title="Gestion des salons"
              description="Les salons pourront être créés et administrés depuis cet espace."
              action={isAdmin ? 'Créer un salon' : undefined}
            />
          )}

          {activePage === 'Paramètres' && isAdmin && (
            <EmptyPage
              icon={Settings}
              title="Paramètres"
              description="Les paramètres de votre espace collaboratif seront disponibles ici."
            />
          )}

          {/* PIED DE PAGE */}
          <footer className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-10 py-5 border-t border-slate-200 text-xs text-slate-400">
            <p>© 2026 Fat Group Messenger. Tous droits réservés.</p>

            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Connexion serveur à configurer
              </span>

              <button
                type="button"
                className="flex items-center gap-1 hover:text-blue-700 transition"
                title="Assistance"
              >
                <CircleHelp size={14} />
                Assistance
              </button>
            </div>
          </footer>

        </div>
      </main>
    </div>
  )
}

/* TABLEAU DE BORD */
function DashboardHome({ onNavigate, search, user }) {
  const stats = [
    {
      title: 'Membres inscrits',
      value: '—',
      detail: 'Données à récupérer',
      icon: Users,
    },
    {
      title: 'Membres connectés',
      value: '—',
      detail: 'Présence à implémenter',
      icon: Activity,
    },
    {
      title: 'Salons actifs',
      value: '—',
      detail: 'Données à récupérer',
      icon: MessagesSquare,
    },
    {
      title: 'Messages échangés',
      value: '—',
      detail: 'Données à récupérer',
      icon: MessageCircle,
    },
  ]

  return (
    <>
      {/* BIENVENUE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bienvenue, {user?.first_name} !
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Retrouvez les informations et les activités de votre organisation.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-500 w-fit">
          <CalendarDays size={17} />
          <span>Tableau de bord</span>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.title}
              className="bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Icon size={20} />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900">
                {stat.value}
              </h3>

              <p className="text-xs text-slate-400 mt-2">
                {stat.detail}
              </p>
            </div>
          )
        })}
      </div>

      {/* ZONE PRINCIPALE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-7">

        {/* ACTIVITÉ */}
        <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900">
                Activité de l'organisation
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Suivi des échanges et des interactions
              </p>
            </div>

            <Activity size={20} className="text-slate-400" />
          </div>

          <div className="min-h-52 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-lg p-6">
            <MessagesSquare size={30} className="text-slate-300 mb-3" />

            <p className="text-sm font-semibold text-slate-600">
              Aucune donnée d'activité disponible
            </p>

            <p className="text-xs text-slate-400 mt-2 max-w-sm">
              Le graphique apparaîtra lorsque les statistiques de messages
              seront disponibles dans l'API.
            </p>
          </div>
        </section>

        {/* MEMBRES CONNECTÉS */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">
                Membres en ligne
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Présence des utilisateurs
              </p>
            </div>

            <Users size={20} className="text-slate-400" />
          </div>

          <div className="min-h-52 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Users size={22} className="text-slate-400" />
            </div>

            <p className="text-sm font-semibold text-slate-600">
              Présence non disponible
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Le suivi des connexions sera ajouté avec les WebSockets.
            </p>
          </div>

          <button
            onClick={() => onNavigate('Membres')}
            className="w-full text-center text-xs font-semibold text-blue-700 hover:text-blue-900 mt-4 pt-4 border-t border-slate-100"
          >
            Voir les membres
          </button>
        </section>
      </div>

      {/* ACTIVITÉS ET SALONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ACTIVITÉS RÉCENTES */}
        <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">
                Activités récentes
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Les dernières actions sur la plateforme
              </p>
            </div>

            <MoreHorizontal size={21} className="text-slate-400" />
          </div>

          <div className="min-h-36 flex flex-col items-center justify-center text-center">
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <CalendarDays size={20} className="text-slate-400" />
            </div>

            <p className="text-sm font-semibold text-slate-600">
              Aucune activité à afficher
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Les événements seront affichés lorsqu'ils seront enregistrés par le serveur.
            </p>
          </div>
        </section>

        {/* SALONS */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-900">
                Salons de discussion
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Espaces de communication
              </p>
            </div>

            <button
              onClick={() => onNavigate('Salons')}
              className="text-blue-700 hover:text-blue-900"
              title="Gérer les salons"
            >
              <Plus size={19} />
            </button>
          </div>

          <div className="min-h-36 flex flex-col items-center justify-center text-center">
            <Hash size={27} className="text-slate-300 mb-3" />

            <p className="text-sm font-semibold text-slate-600">
              Aucun salon chargé
            </p>

            <p className="text-xs text-slate-400 mt-2">
              Les salons apparaîtront ici après leur création.
            </p>
          </div>

          <button
            onClick={() => onNavigate('Salons')}
            className="w-full mt-4 pt-4 border-t border-slate-100 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            Gérer les salons
          </button>
        </section>
      </div>

      {/* RACCOURCIS */}
      <section className="mt-7 bg-white rounded-xl border border-slate-200 p-5 sm:p-6">
        <h3 className="font-bold text-slate-900 mb-4">
          Accès rapide
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction
            icon={MessagesSquare}
            label="Ouvrir la messagerie"
            onClick={() => onNavigate('Messagerie')}
          />

          <QuickAction
            icon={UserPlus}
            label="Gérer les membres"
            onClick={() => onNavigate('Membres')}
          />

          <QuickAction
            icon={ShieldCheck}
            label="Paramètres"
            onClick={() => onNavigate('Paramètres')}
          />
        </div>
      </section>
    </>
  )
}

/* RACCOURCI */
function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition text-left"
    >
      <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <Icon size={19} className="text-blue-700" />
        {label}
      </span>

      <ChevronRight size={17} className="text-slate-400" />
    </button>
  )
}

/* PAGES EN ATTENTE D'IMPLÉMENTATION */
function EmptyPage({ icon: Icon, title, description, action }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-10">
      <div className="max-w-xl mx-auto min-h-80 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5">
          <Icon size={30} />
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed mt-3">
          {description}
        </p>

        {action && (
          <button
            type="button"
            disabled
            title="Cette fonctionnalité sera activée lors de l'intégration backend."
            className="mt-6 flex items-center gap-2 bg-slate-100 text-slate-400 px-5 py-3 rounded-lg text-sm font-semibold cursor-not-allowed"
          >
            <Plus size={17} />
            {action}
          </button>
        )}

        <p className="text-xs text-slate-400 mt-5">
          Cette fonctionnalité sera développée dans la prochaine étape.
        </p>
      </div>
    </section>
  )
}

export default Dashboard