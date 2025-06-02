import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../../firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  orderBy
} from 'firebase/firestore'
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  FlagIcon,
  BellIcon,
  PlusIcon,
  ExclamationCircleIcon,
  HomeIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  TruckIcon,
  FilmIcon,
  ShoppingCartIcon,
  ReceiptPercentIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ChevronUpDownIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import ProfileTab from './ProfileTab'
import { Listbox } from '@headlessui/react'

function DepositorDashboard({ user }) {
  const [balance, setBalance] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [expenses, setExpenses] = useState([])
  const [goals, setGoals] = useState([])
  const [allActivities, setAllActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [error, setError] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showGoalProgressModal, setShowGoalProgressModal] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [progressAmount, setProgressAmount] = useState('')

  const categoryOptions = [
    { name: 'Food', icon: ShoppingBagIcon },
    { name: 'Transportation', icon: TruckIcon },
    { name: 'Entertainment', icon: FilmIcon },
    { name: 'Shopping', icon: ShoppingCartIcon },
    { name: 'Bills', icon: ReceiptPercentIcon },
    { name: 'Other', icon: QuestionMarkCircleIcon },
  ]
  const [selectedCategory, setSelectedCategory] = useState(categoryOptions[0])

  // Define navigation items for the top navbar
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: HomeIcon },
    { id: 'expenses', label: 'Expenses', icon: ChartBarIcon },
    { id: 'goals', label: 'Goals', icon: FlagIcon },
    { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  ]

  useEffect(() => {
    if (!user || !user.id) {
      console.error('User or user.id is undefined')
      return
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id))
        if (userDoc.exists()) {
          setBalance(userDoc.data().balance || 0)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    // Listen for notifications
    const notificationsRef = collection(db, 'notifications')
    const q = query(notificationsRef, where('userId', '==', user.id))
    const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      const notificationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        activityType: 'notification',
        date: doc.data().timestamp?.toDate()
      }))
      setNotifications(notificationList)
    })

    // Listen for expenses in real-time with ordering
    const expensesRef = collection(db, 'expenses')
    const expensesQuery = query(
      expensesRef, 
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    )
    console.log('Setting up expenses listener for user:', user.id) // Debug log
    const unsubscribeExpenses = onSnapshot(expensesQuery, snapshot => {
      console.log('Expenses snapshot received:', snapshot.docs.length, 'documents') // Debug log
      const expenseList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        activityType: 'expense',
        date: doc.data().createdAt?.toDate()
      }))
      console.log('Processed expenses:', expenseList) // Debug log
      setExpenses(expenseList)
    }, error => {
      console.error('Error in expenses listener:', error) // Debug log
    })

    // Fetch goals
    const goalsRef = collection(db, 'goals')
    const goalsQuery = query(goalsRef, where('userId', '==', user.id))
    const unsubscribeGoals = onSnapshot(goalsQuery, snapshot => {
      const goalList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        activityType: 'goal',
        date: doc.data().createdAt?.toDate() || new Date()
      }))
      setGoals(goalList)
      setLoading(false) // Set loading to false after all initial fetches
    })

    fetchUserData()
    return () => {
      unsubscribeNotifications()
      unsubscribeExpenses() // Unsubscribe from expenses listener
      unsubscribeGoals()
    }
  }, [user])

  // Combine and sort all activities whenever notifications, expenses, or goals change
  useEffect(() => {
    const combined = [...notifications, ...expenses, ...goals]
    const sorted = combined.sort((a, b) => {
      const dateA = a.date
      const dateB = b.date
      return dateB - dateA
    })
    setAllActivities(sorted)
  }, [notifications, expenses, goals])

  const handleDeposit = async (amount, reason) => {
    try {
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount')
        setShowErrorModal(true)
        return
      }

      await addDoc(collection(db, 'notifications'), {
        type: 'deposit',
        userId: user.id,
        username: user.username,
        amount: parseFloat(amount),
        reason: reason || 'No reason provided',
        status: 'pending',
        timestamp: new Date()
      })
      setShowDepositModal(false)
    } catch (error) {
      console.error('Error creating deposit request:', error)
      setError('Failed to create deposit request')
      setShowErrorModal(true)
    }
  }

  const handleWithdraw = async (amount, reason) => {
    try {
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount')
        setShowErrorModal(true)
        return
      }

      if (parseFloat(amount) > balance) {
        setError('Withdrawal amount cannot exceed your current balance')
        setShowErrorModal(true)
        return
      }

      await addDoc(collection(db, 'notifications'), {
        type: 'withdraw',
        userId: user.id,
        username: user.username,
        amount: parseFloat(amount),
        reason: reason || 'No reason provided',
        status: 'pending',
        timestamp: new Date()
      })
      setShowWithdrawModal(false)
    } catch (error) {
      console.error('Error creating withdrawal request:', error)
      setError('Failed to create withdrawal request')
      setShowErrorModal(true)
    }
  }

  const handleAddExpense = async (amount, category, description, title) => {
    try {
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount')
        setShowErrorModal(true)
        return
      }

      const expenseData = {
        userId: user.id,
        amount: parseFloat(amount),
        category,
        description,
        createdAt: new Date(),
        title: title || description.split(' ').slice(0, 3).join(' ')
      }

      console.log('Current user:', user) // Debug log
      console.log('Adding expense with data:', expenseData) // Debug log
      const docRef = await addDoc(collection(db, 'expenses'), expenseData)
      console.log('Expense added with ID:', docRef.id) // Debug log
      setShowExpenseModal(false)
    } catch (error) {
      console.error('Error adding expense:', error)
      setError('Failed to add expense')
      setShowErrorModal(true)
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    try {
      // Get the expense details before deleting
      const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
      const expenseData = expenseDoc.data();

      // Delete the expense
      await deleteDoc(doc(db, 'expenses', expenseId));

      // Add a deletion activity to notifications
      await addDoc(collection(db, 'notifications'), {
        type: 'expense_deleted',
        userId: user.id,
        username: user.username,
        amount: expenseData.amount,
        title: expenseData.title || expenseData.description,
        category: expenseData.category,
        status: 'completed',
        timestamp: new Date()
      });

      setShowDeleteModal(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense');
      setShowErrorModal(true);
    }
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense)
    setShowDeleteModal(true)
  }

  const handleAddGoal = async (title, targetAmount, deadline) => {
    try {
      await addDoc(collection(db, 'goals'), {
        userId: user.id,
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        deadline: new Date(deadline),
        status: 'in_progress',
        createdAt: new Date()
      })
      setShowGoalModal(false)
    } catch (error) {
      console.error('Error adding goal:', error)
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Food':
        return <ShoppingBagIcon className="h-6 w-6 text-orange-500" />
      case 'Transportation':
        return <TruckIcon className="h-6 w-6 text-blue-500" />
      case 'Entertainment':
        return <FilmIcon className="h-6 w-6 text-purple-500" />
      case 'Shopping':
        return <ShoppingCartIcon className="h-6 w-6 text-pink-500" />
      case 'Bills':
        return <ReceiptPercentIcon className="h-6 w-6 text-red-500" />
      default:
        return <QuestionMarkCircleIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const handleUpdateGoalProgress = async (amount, isAdding = true) => {
    try {
      if (!amount || amount <= 0) {
        setError('Please enter a valid amount')
        setShowErrorModal(true)
        return
      }

      const goalRef = doc(db, 'goals', selectedGoal.id)
      const newAmount = isAdding 
        ? selectedGoal.currentAmount + parseFloat(amount)
        : selectedGoal.currentAmount - parseFloat(amount)

      // Prevent negative balance
      if (newAmount < 0) {
        setError('Cannot reduce progress below 0')
        setShowErrorModal(true)
        return
      }

      // Update goal progress
      await updateDoc(goalRef, {
        currentAmount: newAmount,
        status: newAmount >= selectedGoal.targetAmount ? 'completed' : 'in_progress'
      })

      setShowGoalProgressModal(false)
      setSelectedGoal(null)
      setProgressAmount('')
    } catch (error) {
      console.error('Error updating goal progress:', error)
      setError('Failed to update goal progress')
      setShowErrorModal(true)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Navbar */}
      <div className="sticky top-0 z-10 w-full flex justify-center bg-transparent">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="flex justify-center sm:justify-start gap-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === item.id
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">{item.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              {/* Welcome Section with Gradient */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Welcome back, {user.username}</h2>
                      <p className="mt-1 text-emerald-100">Here's your financial overview</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white text-sm">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Card with Glass Effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-20"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Balance</p>
                      <p className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-400">₱{balance.toFixed(2)}</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <BanknotesIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDepositModal(true)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-6 py-5 flex items-center cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 min-h-[90px]"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <ArrowUpTrayIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">Deposit</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">Add money to your account</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowWithdrawModal(true)}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-6 py-5 flex items-center cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 min-h-[90px]"
                >
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                    <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">Withdraw</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">Request a withdrawal</p>
                  </div>
                </motion.button>
              </div>

              {/* Recent Activity with Modern Cards */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {allActivities.slice(0, 5).map((activity) => (
                    <motion.div 
                      key={activity.id}
                      whileHover={{ backgroundColor: 'rgba(139, 192, 234, 0.1)' }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 px-2 -mx-2 cursor-pointer rounded-md group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                          activity.activityType === 'notification' 
                            ? (activity.type === 'deposit' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                              : activity.type === 'expense_deleted'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : 'bg-red-100 dark:bg-red-900/30')
                            : activity.activityType === 'expense' 
                            ? 'bg-orange-100 dark:bg-orange-900/30' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {activity.activityType === 'notification' ? (
                            activity.type === 'deposit' ? (
                              <ArrowUpTrayIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : activity.type === 'expense_deleted' ? (
                              <TrashIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            ) : (
                              <ArrowDownTrayIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )
                          ) : activity.activityType === 'expense' ? (
                            <ShoppingBagIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <FlagIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {activity.activityType === 'notification' ? (
                              activity.type === 'deposit' ? 'Deposit Request' :
                              activity.type === 'expense_deleted' ? `Deleted Expense: ${activity.title}` :
                              'Withdrawal Request'
                            ) : activity.activityType === 'expense' ? (
                              `Expense: ${activity.title || activity.description}`
                            ) : (
                              `Goal Added: ${activity.title}`
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.activityType === 'expense' && `Category: ${activity.category}`}
                            {activity.activityType === 'goal' && `Target: ₱${activity.targetAmount}`}
                            {activity.type === 'expense_deleted' && `Category: ${activity.category}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {activity.activityType !== 'goal' && (
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">₱{activity.amount?.toFixed(2)}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {activity.date?.toDate?.()?.toLocaleDateString() || new Date(activity.date).toLocaleDateString()}{' '}
                          {activity.date?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {activity.activityType === 'notification' && activity.type !== 'expense_deleted' && (
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full mt-1 ${
                            activity.status === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : activity.status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {allActivities.length === 0 && (
                    <div className="px-6 py-8 text-center">
                      <BellIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your transactions, expenses, and goals will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Request Deposit</h2>
              <form onSubmit={(e) => {
                e.preventDefault()
                const amount = e.target.amount.value
                const reason = e.target.reason.value
                handleDeposit(amount, reason)
              }} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount (₱)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      required
                      min="0"
                      step="0.01"
                      className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason (Optional)
                  </label>
                  <textarea
                    name="reason"
                    id="reason"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Enter reason for deposit..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowDepositModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Request Deposit
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'withdraw' && (
            <motion.div
              key="withdraw"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Request Withdrawal</h2>
              <form onSubmit={(e) => {
                e.preventDefault()
                const amount = e.target.amount.value
                const reason = e.target.reason.value
                handleWithdraw(amount, reason)
              }} className="space-y-5">
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Amount (₱)</label>
                  <div className="relative">
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      required
                      min="0"
                      max={balance}
                      step="0.01"
                      className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm font-semibold">Max: ₱{balance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Reason</label>
                  <textarea
                    name="reason"
                    id="reason"
                    rows={3}
                    required
                    className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 resize-none"
                    placeholder="Enter reason for withdrawal..."
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-5 py-2.5 rounded-xl text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition"
                  >
                    Request Withdrawal
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Expenses</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Total Expenses: <span className="font-semibold text-emerald-600 dark:text-emerald-400">₱{calculateTotalExpenses().toFixed(2)}</span>
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExpenseModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Expense
                </motion.button>
              </div>

              {/* Expenses List as Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenses.length === 0 ? (
                  <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No expenses</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new expense.</p>
                  </div>
                ) : (
                  expenses.map((expense) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            {getCategoryIcon(expense.category)}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                              {expense.title || expense.description}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {expense.category}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClick(expense)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-900 p-1 -mr-1"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₱{expense.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {expense.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {expense.createdAt.toDate().toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'goals' && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Savings Goals</h2>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowGoalModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Goal
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map((goal) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{goal.title}</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Target: ₱{goal.targetAmount}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Current: ₱{goal.currentAmount}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Deadline: {new Date(goal.deadline.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        goal.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block text-emerald-600 dark:text-emerald-400">
                              Progress
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-emerald-600 dark:text-emerald-400">
                              {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-200">
                          <div
                            style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                          />
                        </div>
                      </div>
                      {goal.status !== 'completed' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedGoal(goal)
                            setShowGoalProgressModal(true)
                          }}
                          className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          Update Progress
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="space-y-6"
            >
              {/* Profile Header */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                <div className="px-6 pb-6">
                  <div className="flex items-center -mt-12">
                    <div className="h-24 w-24 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg">
                      <div className="h-full w-full rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <UserCircleIcon className="h-16 w-16 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="ml-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.username}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Depositor Account</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₱{balance.toFixed(2)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <BanknotesIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">₱{calculateTotalExpenses().toFixed(2)}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <ArrowTrendingDownIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Goals</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{goals.filter(goal => goal.status === 'in_progress').length}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FlagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {new Date('2024-03-15').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {allActivities.slice(0, 15).map((activity) => (
                    <motion.div 
                      key={activity.id}
                      whileHover={{ backgroundColor: 'rgba(156, 163, 175, 0.05)' }} // Subtle gray-400 with 5% opacity
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between py-4 px-6 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                          activity.activityType === 'notification' 
                            ? (activity.type === 'deposit' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30')
                            : activity.activityType === 'expense' 
                            ? 'bg-orange-100 dark:bg-orange-900/30' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {activity.activityType === 'notification' ? (
                            activity.type === 'deposit' ? (
                              <ArrowUpTrayIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <ArrowDownTrayIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )
                          ) : activity.activityType === 'expense' ? (
                            <ShoppingBagIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <FlagIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {activity.activityType === 'notification' ? (
                              activity.type === 'deposit' ? 'Deposit Request' : 'Withdrawal Request'
                            ) : activity.activityType === 'expense' ? (
                              `Expense: ${activity.title || activity.description}`
                            ) : (
                              `Goal Added: ${activity.title}`
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.activityType === 'expense' && `Category: ${activity.category}`}
                            {activity.activityType === 'goal' && `Target: ₱${activity.targetAmount}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        {activity.activityType !== 'goal' && (
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">₱{activity.amount?.toFixed(2)}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {activity.date?.toDate?.()?.toLocaleDateString() || new Date(activity.date).toLocaleDateString()}{' '}
                          {activity.date?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {activity.activityType === 'notification' && (
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full mt-1 ${
                            activity.status === 'approved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : activity.status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {allActivities.length === 0 && (
                    <div className="px-6 py-8 text-center">
                      <BellIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No recent activity</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your transactions, expenses, and goals will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-4 shadow-md">
                <ArrowUpTrayIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Request Deposit</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enter the amount you wish to deposit and provide a reason for your deposit request.</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const amount = e.target.amount.value
              const reason = e.target.reason.value
              handleDeposit(amount, reason)
            }} className="space-y-5">
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Amount (₱)</label>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  min="0"
                  step="0.01"
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Reason (Optional)</label>
                <textarea
                  name="reason"
                  id="reason"
                  rows={3}
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 resize-none"
                  placeholder="Enter reason for deposit..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-5 py-2.5 rounded-xl text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition"
                >
                  Request Deposit
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-4 shadow-md">
                <ArrowDownTrayIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Request Withdrawal</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Specify the amount you want to withdraw and provide a reason for your withdrawal request.</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const amount = e.target.amount.value
              const reason = e.target.reason.value
              handleWithdraw(amount, reason)
            }} className="space-y-5">
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Amount (₱)</label>
                <div className="relative">
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    required
                    min="0"
                    max={balance}
                    step="0.01"
                    className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm font-semibold">Max: ₱{balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Reason</label>
                <textarea
                  name="reason"
                  id="reason"
                  rows={3}
                  required
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 resize-none"
                  placeholder="Enter reason for withdrawal..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-5 py-2.5 rounded-xl text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition"
                >
                  Request Withdrawal
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-4 shadow-md">
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Add Expense</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Fill in the details of your expense including title, amount, category, and description.</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const title = e.target.title.value
              const amount = e.target.amount.value
              const category = selectedCategory.name
              const description = e.target.description.value
              handleAddExpense(amount, category, description, title)
            }} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  maxLength={40}
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="e.g. Grocery Shopping"
                />
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Amount (₱)</label>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  min="0"
                  step="0.01"
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Category</label>
                <Listbox value={selectedCategory} onChange={setSelectedCategory}>
                  <div className="relative mt-1">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white/70 dark:bg-gray-900/60 py-3 pl-4 pr-12 text-left border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 text-base text-gray-900 dark:text-gray-200 transition">
                      <span className="flex items-center">
                        <selectedCategory.icon className="h-5 w-5 mr-2 text-emerald-500" />
                        {selectedCategory.name}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-200" aria-hidden="true" />
                      </span>
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white/90 dark:bg-gray-900/90 shadow-lg ring-1 ring-black/10 dark:ring-white/10 focus:outline-none text-base">
                      {categoryOptions.map((option, idx) => (
                        <Listbox.Option
                          key={option.name}
                          value={option}
                          className={({ active, selected }) =>
                            `cursor-pointer select-none relative py-3 pl-10 pr-4 rounded-xl transition
                            ${active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-gray-200'}
                            ${selected ? 'font-semibold' : 'font-normal'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className="absolute left-3 flex items-center">
                                <option.icon className="h-5 w-5 mr-2 text-emerald-500" />
                              </span>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.name}</span>
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Description</label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  required
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 resize-none"
                  placeholder="Enter expense description..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-5 py-2.5 rounded-xl text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition"
                >
                  Add Expense
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-4 shadow-md">
                <FlagIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Add Savings Goal</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set up a new savings goal by specifying the target amount and deadline.</p>
              </div>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              const title = e.target.title.value
              const targetAmount = e.target.targetAmount.value
              const deadline = e.target.deadline.value
              handleAddGoal(title, targetAmount, deadline)
            }} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Goal Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="e.g. Save for a new phone"
                />
              </div>
              <div>
                <label htmlFor="targetAmount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Target Amount (₱)</label>
                <input
                  type="number"
                  name="targetAmount"
                  id="targetAmount"
                  required
                  min="0"
                  step="0.01"
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="deadline" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Target Date</label>
                <input
                  type="date"
                  name="deadline"
                  id="deadline"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-base shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-5 py-2.5 rounded-xl text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition"
                >
                  Add Goal
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Expense Modal */}
      {showDeleteModal && expenseToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center mr-4 shadow-md">
                <TrashIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Delete Expense</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please confirm that you want to delete this expense. This action cannot be undone.</p>
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-6 space-y-2 border border-gray-200 dark:border-gray-600">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Title: {expenseToDelete.title || expenseToDelete.description}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Category: {expenseToDelete.category}</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2">Amount: ₱{expenseToDelete.amount.toFixed(2)}</p>
            </div>
            <div className="flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowDeleteModal(false)
                  setExpenseToDelete(null)
                }}
                className="px-5 py-2.5 rounded-xl text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDeleteExpense(expenseToDelete.id)}
                className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 shadow-md hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              >
                Delete
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-200 dark:border-red-700"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center mr-4 shadow-md">
                <XCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Error</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">We encountered an issue processing your request. Please try again or contact support if the problem persists.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowErrorModal(false)}
                className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 shadow-md hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Goal Progress Modal */}
      {showGoalProgressModal && selectedGoal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mr-4 shadow-md">
                <BanknotesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Update Goal Progress</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add or remove funds from your savings goal to track your progress.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{selectedGoal.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current Progress: ₱{selectedGoal.currentAmount} / ₱{selectedGoal.targetAmount}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="progressAmount" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Amount (₱)
                </label>
                <input
                  type="number"
                  id="progressAmount"
                  value={progressAmount}
                  onChange={(e) => setProgressAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 px-4 py-3 text-lg shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowGoalProgressModal(false)
                    setSelectedGoal(null)
                    setProgressAmount('')
                  }}
                  className="px-5 py-2.5 rounded-xl text-base font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleUpdateGoalProgress(progressAmount, false)}
                  className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 shadow-md hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
                >
                  Remove
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleUpdateGoalProgress(progressAmount, true)}
                  className="px-5 py-2.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500 transition"
                >
                  Add
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default DepositorDashboard 