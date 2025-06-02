import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../../firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  onSnapshot,
  getDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import {
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  BellIcon,
  ChartBarIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('home')
  const [depositors, setDepositors] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRegistrations, setNewRegistrations] = useState([])
  const [activeUsers, setActiveUsers] = useState(new Set())

  useEffect(() => {
    // Fetch depositors and listen for changes
    const depositorsRef = collection(db, 'users')
    const depositorsQuery = query(depositorsRef, where('role', '==', 'depositor'))
    
    const unsubscribeDepositors = onSnapshot(depositorsQuery, (snapshot) => {
      const depositorList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setDepositors(depositorList)
      
      // Track active users
      const active = new Set()
      depositorList.forEach(depositor => {
        if (depositor.lastActive && new Date(depositor.lastActive.toDate()).toDateString() === new Date().toDateString()) {
          active.add(depositor.id)
        }
      })
      setActiveUsers(active)
    })

    // Listen for notifications
    const notificationsRef = collection(db, 'notifications')
    const notificationsQuery = query(notificationsRef, orderBy('timestamp', 'desc'))
    
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setNotifications(notificationList)
      setLoading(false)
    })

    // Listen for new registrations
    const newRegistrationsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'depositor'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribeRegistrations = onSnapshot(newRegistrationsQuery, 
      (snapshot) => {
        const registrations = snapshot.docs
          .filter(doc => {
            const data = doc.data()
            return data.createdAt && new Date(data.createdAt.toDate()).toDateString() === new Date().toDateString()
          })
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        setNewRegistrations(registrations)
      },
      (error) => {
        console.error('Error fetching new registrations:', error)
        // If index is not created yet, fetch without ordering
        const fallbackQuery = query(
          collection(db, 'users'),
          where('role', '==', 'depositor')
        )
        onSnapshot(fallbackQuery, (snapshot) => {
          const registrations = snapshot.docs
            .filter(doc => {
              const data = doc.data()
              return data.createdAt && new Date(data.createdAt.toDate()).toDateString() === new Date().toDateString()
            })
            .map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
          setNewRegistrations(registrations)
        })
      }
    )

    return () => {
      unsubscribeDepositors()
      unsubscribeNotifications()
      unsubscribeRegistrations()
    }
  }, [])

  const handleRequest = async (notificationId, action) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (!notification) return

    try {
      // Update notification status
      await updateDoc(doc(db, 'notifications', notificationId), {
        status: action === 'approve' ? 'approved' : 'rejected',
        processedAt: serverTimestamp()
      })

      // Update user balance if approved
      if (action === 'approve') {
        const userRef = doc(db, 'users', notification.userId)
        const userDoc = await getDoc(userRef)
        const currentBalance = userDoc.data().balance || 0

        const newBalance = notification.type === 'deposit' 
          ? currentBalance + notification.amount
          : currentBalance - notification.amount

        await updateDoc(userRef, { 
          balance: newBalance,
          lastActive: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error handling request:', error)
    }
  }

  // Calculate total balance and percentage change
  const totalBalance = depositors.reduce((sum, d) => sum + (d.balance || 0), 0)
  const previousBalance = depositors.reduce((sum, d) => sum + (d.previousBalance || 0), 0)
  const percentageChange = previousBalance === 0 ? 0 : ((totalBalance - previousBalance) / previousBalance) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-900 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Tabs */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 rounded-2xl">
        <div className="flex justify-center sm:justify-start gap-2 py-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'home'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <HomeIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('depositors')}
            className={`flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'depositors'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <UserGroupIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Depositors</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'notifications'
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <BellIcon className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 sm:px-6 py-6 sm:py-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white dark:text-gray-200">Welcome back, Admin</h2>
                      <p className="mt-1 text-sm sm:text-base text-emerald-100 dark:text-emerald-100">Here's what's happening with your depositors today.</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 text-white text-sm">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Depositors</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-200">{depositors.length}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-emerald-600 font-medium dark:text-emerald-300">Active</span>
                    <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">Updated just now</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Balance</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-200">
                        ₱{totalBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <BanknotesIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={`font-medium flex items-center ${
                      percentageChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                    } dark:text-${percentageChange >= 0 ? 'emerald-300' : 'red-300'}`}>
                      {percentageChange >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {percentageChange.toFixed(1)}% change
                    </span>
                    <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">vs last month</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Pending Requests</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-200">{notifications.filter(n => n.status === 'pending').length}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <BellIcon className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-amber-600 font-medium dark:text-amber-300">Requires attention</span>
                    <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">Action needed</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Active Today</p>
                      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-200">{activeUsers.size}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-purple-600 font-medium dark:text-purple-300">Active users</span>
                    <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                    <span className="text-gray-500 dark:text-gray-400">In the last 24h</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity and New Registrations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-200">Recent Activity</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              notification.type === 'deposit' ? 'bg-emerald-100' : 'bg-blue-100'
                            }`}>
                              {notification.type === 'deposit' ? (
                                <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {notification.type === 'deposit' ? 'Deposit Request' : 'Withdrawal Request'}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">From: {notification.username}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">₱{notification.amount}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {notification.timestamp?.toDate().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Registrations */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-200">New Registrations</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {newRegistrations.length > 0 ? (
                      newRegistrations.map((registration) => (
                        <div key={registration.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-lg font-semibold">
                              {registration.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{registration.username}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Registered {registration.createdAt?.toDate().toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 sm:px-6 py-8 text-center">
                        <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No new registrations</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">New depositors will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'depositors' && (
            <motion.div
              key="depositors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-8"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Depositors</p>
                      <p className="text-2xl font-bold text-gray-800">{depositors.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Balance</p>
                      <p className="text-2xl font-bold text-gray-800">
                        ₱{depositors.reduce((sum, d) => sum + (d.balance || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Today</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {depositors.filter(d => d.lastActive === new Date().toDateString()).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Depositors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {depositors.map((depositor) => (
                  <motion.div
                    key={depositor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <UserCircleIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200">{depositor.username}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {depositor.id}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Balance</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">₱{depositor.balance || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Last Active</span>
                        <span className="text-sm text-gray-900 dark:text-gray-200">
                          {depositor.lastActive ? new Date(depositor.lastActive.toDate()).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Status</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${depositor.lastActive && new Date(depositor.lastActive.toDate()).toDateString() === new Date().toDateString() ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>{depositor.lastActive && new Date(depositor.lastActive.toDate()).toDateString() === new Date().toDateString() ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors duration-200">
                          View Details
                        </button>
                        <button className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200">
                          Transaction History
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {depositors.length === 0 && (
                <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <UserGroupIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No depositors</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Get started by registering new depositors.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-4 sm:space-y-6"
            >
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${
                          notification.type === 'deposit' ? 'bg-emerald-100' : 'bg-blue-100'
                        }`}>
                          {notification.type === 'deposit' ? (
                            <ArrowTrendingUpIcon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-200">
                            {notification.type === 'deposit' ? 'Deposit Request' : 'Withdrawal Request'}
                          </h3>
                          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            From: {notification.username}
                          </p>
                          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Amount: ₱{notification.amount}
                          </p>
                          {notification.reason && (
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              Reason: {notification.reason}
                            </p>
                          )}
                          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Requested: {notification.timestamp?.toDate().toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {notification.status === 'pending' ? (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRequest(notification.id, 'approve')}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                          >
                            <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                            Approve
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRequest(notification.id, 'reject')}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                          >
                            <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                            Reject
                          </motion.button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${
                          notification.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {notification.status}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminDashboard 