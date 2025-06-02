import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HomeIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  ChartBarIcon, 
  FlagIcon,
  BellIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import AdminDashboard from './dashboard/AdminDashboard'
import DepositorDashboard from './dashboard/DepositorDashboard'

function Dashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('home')
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Navigation items are now defined within the dashboards themselves
  // const navItems = user.role === 'admin' ? [
  //   { id: 'home', label: 'Dashboard', icon: HomeIcon },
  //   { id: 'depositors', label: 'Depositors', icon: UserGroupIcon },
  //   { id: 'notifications', label: 'Notifications', icon: BellIcon },
  // ] : [
  //   { id: 'home', label: 'Dashboard', icon: HomeIcon },
  //   { id: 'deposit', label: 'Deposit', icon: ArrowUpTrayIcon },
  //   { id: 'withdraw', label: 'Withdraw', icon: ArrowDownTrayIcon },
  //   { id: 'expenses', label: 'Expenses', icon: ChartBarIcon },
  //   { id: 'goals', label: 'Goals', icon: FlagIcon },
  //   { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  // ]

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#f0f9f4]">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-[#1a4d2e] text-white z-50">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 border-b border-[#2d6a4f]">
              <h1 className="text-2xl font-bold">BebeBank</h1>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-[#2d6a4f]">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-emerald-600 font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-emerald-200">{user.role}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Admin Nav Items */}
              {[ // Define admin nav items directly here
                 { id: 'home', label: 'Dashboard', icon: HomeIcon },
                 { id: 'depositors', label: 'Depositors', icon: UserGroupIcon },
                 { id: 'notifications', label: 'Notifications', icon: BellIcon },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#2d6a4f] text-white'
                      : 'text-emerald-100 hover:bg-[#2d6a4f]/50'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-[#2d6a4f]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-[#2d6a4f]/50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Sign Out</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 p-8">
          <AnimatePresence mode="wait">
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AdminDashboard activeTab={activeTab} />
              </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  } else { // Depositor
    return (
      <motion.div
        key="depositor"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Depositor Dashboard will now handle its own top navbar */}
        <DepositorDashboard user={user} />
      </motion.div>
    )
  }
}

export default Dashboard 