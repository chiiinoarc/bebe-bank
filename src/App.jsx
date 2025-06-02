// Updated imports for Firestore authentication
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { db } from './firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import AdminDashboard from './components/dashboard/AdminDashboard'
import DepositorDashboard from './components/dashboard/DepositorDashboard'
import DevLog from './components/DevLog'
import { 
  UserIcon, 
  LockClosedIcon, 
  ArrowRightIcon, 
  EnvelopeIcon, 
  ShieldCheckIcon, 
  HeartIcon,
  EyeIcon,
  ShieldExclamationIcon,
  KeyIcon,
  UserGroupIcon,
  LockClosedIcon as LockIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [user, setUser] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [focused, setFocused] = useState({
    username: false,
    password: false,
    confirmPassword: false
  })
  const [showConsent, setShowConsent] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showRecoveryCode, setShowRecoveryCode] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      // Try to get the document with the provided username
      const userDocRef = doc(db, 'users', username.toLowerCase())
      const userDoc = await getDoc(userDocRef)
      
      if (!userDoc.exists()) {
        setError('User not found')
        return
      }

      const userData = userDoc.data()

      // Check if the provided password matches either the password or recovery code
      if (userData.password.toString() === password || userData.recoveryCode === password) {
        const user = {
          id: userDoc.id,
          username: userData.username,
          role: userData.role,
          sessionId: Date.now() // Add a unique session ID
        }
        setUser(user)
      } else {
        setError('Invalid password')
      }
    } catch (error) {
      console.error('Error signing in:', error)
      setError('Error signing in')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Check if username already exists
      const userDocRef = doc(db, 'users', username.toLowerCase())
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        setError('Username already exists')
        return
      }

      // Store form data and show consent modal
      setFormData({
        username,
        password
      })
      setShowConsent(true)
      setLoading(false)
    } catch (error) {
      console.error('Error checking username:', error)
      setError('Error checking username')
      setLoading(false)
    }
  }

  // Function to generate a random 4-digit code
  const generateRecoveryCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleConsentSubmit = async () => {
    if (!consentChecked) return

    setLoading(true)
    try {
      // Generate recovery code
      const code = generateRecoveryCode()
      setRecoveryCode(code)

      // Create new user
      const userDocRef = doc(db, 'users', formData.username.toLowerCase())
      await setDoc(userDocRef, {
        username: formData.username,
        password: formData.password,
        recoveryCode: code,
        role: 'depositor',
        createdAt: new Date().toISOString()
      })

      // Sign in the new user
      const user = {
        id: userDocRef.id,
        username: formData.username,
        role: 'depositor',
        sessionId: Date.now()
      }
      setUser(user)
      setShowConsent(false)
      setShowRecoveryCode(true)
    } catch (error) {
      console.error('Error registering:', error)
      setError('Error creating account')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    setUser(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"
        />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-x-hidden flex flex-col">
        {/* Navbar */}
        <motion.nav
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-gray-800/30 backdrop-blur-xl shadow-sm border-b border-gray-700/30"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center"
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                  BeBeBank<span className="text-xs text-gray-400"> BETA</span>
                </h1>
              </motion.div>
              <div className="flex items-center space-x-4">
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSignOut}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Sign Out
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/devlog'}
                  className="group relative flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  <span className="text-sm">DevLog</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Main Content */}
        <main className="py-6 flex-grow">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  user.role === 'admin' ? (
                    <AdminDashboard user={user} />
                  ) : (
                    <DepositorDashboard user={user} />
                  )
                ) : (
                  <div className="max-w-md mx-auto mt-8 pb-32 px-4 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showRegister ? 'register' : 'login'}
                        initial={{ x: showRegister ? 1000 : -1000, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: showRegister ? -1000 : 1000, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-gray-800/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/30 p-8 relative"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center mb-8"
                        >
                          <motion.h2
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent mb-2"
                          >
                            {showRegister ? 'Create Account' : 'Welcome Back'}
                          </motion.h2>
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-400"
                          >
                            {showRegister ? 'Start your journey with us' : 'Sign in to your account'}
                          </motion.p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mb-6 p-4 bg-red-900/20 text-red-400 rounded-2xl border border-red-500/30 backdrop-blur-sm"
                            >
                              {error}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.form
                          onSubmit={showRegister ? handleRegister : handleSignIn}
                          className="space-y-6"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-2"
                          >
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
                              Username
                            </label>
                            <div className="relative group">
                              <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={`block w-full rounded-2xl bg-gray-700/30 border-gray-600/50 text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 pl-4 pr-10 py-3 ${
                                  focused.username ? 'ring-2 ring-emerald-500' : ''
                                }`}
                                onFocus={() => setFocused({ ...focused, username: true })}
                                onBlur={() => setFocused({ ...focused, username: false })}
                                required
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <UserIcon className="h-5 w-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="space-y-2"
                          >
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                              Password
                            </label>
                            <div className="relative group">
                              <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`block w-full rounded-2xl bg-gray-700/30 border-gray-600/50 text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 pl-4 pr-10 py-3 ${
                                  focused.password ? 'ring-2 ring-emerald-500' : ''
                                }`}
                                onFocus={() => setFocused({ ...focused, password: true })}
                                onBlur={() => setFocused({ ...focused, password: false })}
                                required
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <LockIcon className="h-5 w-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                              </div>
                            </div>
                          </motion.div>

                          <AnimatePresence>
                            {showRegister && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-2 overflow-hidden"
                              >
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                                  Confirm Password
                                </label>
                                <div className="relative group">
                                  <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`block w-full rounded-2xl bg-gray-700/30 border-gray-600/50 text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 pl-4 pr-10 py-3 ${
                                      focused.confirmPassword ? 'ring-2 ring-emerald-500' : ''
                                    }`}
                                    onFocus={() => setFocused({ ...focused, confirmPassword: true })}
                                    onBlur={() => setFocused({ ...focused, confirmPassword: false })}
                                    required
                                  />
                                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <LockIcon className="h-5 w-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-4"
                          >
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="submit"
                              className="w-full flex justify-center items-center px-6 py-3.5 border border-transparent rounded-2xl text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-lg shadow-emerald-500/20"
                            >
                              {showRegister ? 'Create Account' : 'Sign In'}
                              <ArrowRightIcon className="ml-2 h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        </motion.form>

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="mt-8 text-center"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowRegister(!showRegister)
                              setError('')
                            }}
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            {showRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                          </motion.button>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )
              }
            />
            <Route path="/devlog" element={<DevLog />} />
          </Routes>
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 backdrop-blur-xl border-t border-gray-700/30 py-4"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <span>Made with</span>
                <HeartIcon className="h-4 w-4 text-red-500" />
                <span>by Chino for the baby</span>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPrivacy(!showPrivacy)}
                  className="group relative flex items-center space-x-2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <ShieldCheckIcon className="h-5 w-5" />
                  <span className="text-sm">Privacy</span>
                  
                  {/* Tooltip - Only show when not logged in */}
                  {!user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-lg text-xs text-gray-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="p-1 bg-emerald-500/10 rounded">
                          <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                        </div>
                        <p>Learn how we protect your data and privacy at BeBeBank</p>
                      </div>
                      <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800/90 border-r border-b border-gray-700/50"></div>
                    </motion.div>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.footer>

        {/* Privacy Modal */}
        <AnimatePresence>
          {showPrivacy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowPrivacy(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-gray-700/50 shadow-2xl mb-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                      Privacy & Security
                    </h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPrivacy(false)}
                    className="text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <p className="text-gray-300 text-base leading-relaxed">
                    At BeBeBank, we take your privacy seriously. Here's how we handle your data:
                  </p>

                  <div className="grid gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-2xl border border-gray-600/30"
                    >
                      <div className="p-2 bg-blue-500/10 rounded-xl">
                        <KeyIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-gray-100 font-medium mb-1">Secure Password Storage</h4>
                        <p className="text-gray-400 text-sm">Your password is securely stored and never visible to administrators nor other users</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-2xl border border-gray-600/30"
                    >
                      <div className="p-2 bg-purple-500/10 rounded-xl">
                        <EyeIcon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-gray-100 font-medium mb-1">Limited Admin Access</h4>
                        <p className="text-gray-400 text-sm">The admin can only view your total balance and basic account information</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-2xl border border-gray-600/30"
                    >
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <LockIcon className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-gray-100 font-medium mb-1">Private Financial Data</h4>
                        <p className="text-gray-400 text-sm">Your personal goals, expenses, and detailed financial data are private and only visible to you</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-2xl border border-gray-600/30"
                    >
                      <div className="p-2 bg-red-500/10 rounded-xl">
                        <ShieldExclamationIcon className="h-5 w-5 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-gray-100 font-medium mb-1">No Third-Party Sharing</h4>
                        <p className="text-gray-400 text-sm">Your information is never shared with third parties</p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="mt-8 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <p className="text-emerald-400 text-sm leading-relaxed">
                      Your privacy is our priority. We believe in transparency and security.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Consent Modal */}
        <AnimatePresence>
          {showConsent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowConsent(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-gray-700/50 shadow-2xl mb-8"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                      Data Collection Consent
                    </h3>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-gray-300 text-base leading-relaxed">
                    Before creating your account, please review what information we collect and how we use it:
                  </p>

                  <div className="grid gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-2xl border border-gray-600/30"
                    >
                      <div className="p-2 bg-blue-500/10 rounded-xl">
                        <UserIcon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-gray-100 font-medium mb-1">Information We Collect</h4>
                        <ul className="text-gray-400 text-sm space-y-1">
                          <li>• Username (for account identification)</li>
                          <li>• Email address (for account recovery)</li>
                          <li>• Total balance information</li>
                          <li>• Basic account activity</li>
                        </ul>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-start space-x-4 p-4 bg-gray-700/30 rounded-2xl border border-gray-600/30"
                    >
                      <div className="p-2 bg-purple-500/10 rounded-xl">
                        <LockIcon className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-gray-100 font-medium mb-1">Information We Don't Collect</h4>
                        <ul className="text-gray-400 text-sm space-y-1">
                          <li>• Your password (stored securely, never visible)</li>
                          <li>• Personal financial goals</li>
                          <li>• Detailed expense tracking</li>
                          <li>• Sensitive personal information</li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>

                  <div className="mt-6">
                    <label className="flex items-start space-x-3 p-4 bg-gray-700/30 rounded-2xl border border-gray-600/30 cursor-pointer group hover:bg-gray-700/40 transition-colors">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={consentChecked}
                          onChange={(e) => setConsentChecked(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          consentChecked 
                            ? 'bg-emerald-500 border-emerald-500' 
                            : 'border-gray-500 group-hover:border-gray-400'
                        }`}>
                          {consentChecked && (
                            <CheckCircleIcon className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-gray-300 text-sm">
                        I understand and consent to the collection and use of my information as described above. I acknowledge that my password will be securely stored and never visible to administrators or other users.
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowConsent(false)}
                      className="px-6 py-2.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConsentSubmit}
                      disabled={!consentChecked}
                      className={`px-6 py-2.5 rounded-xl transition-all ${
                        consentChecked
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                          : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Create Account
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recovery Code Modal */}
        <AnimatePresence>
          {showRecoveryCode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full border border-gray-700/50 shadow-2xl mb-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                      <KeyIcon className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                      Your Recovery Code
                    </h3>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="text-gray-300 text-base leading-relaxed">
                    Please save this recovery code in a safe place. You can use it to log in if you forget your password.
                  </p>

                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="p-6 bg-gray-700/30 rounded-2xl border border-gray-600/30 text-center"
                  >
                    <p className="text-sm text-gray-400 mb-2">Your Recovery Code</p>
                    <div className="flex items-center justify-center space-x-2">
                      {recoveryCode.split('').map((digit, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="w-12 h-16 bg-gray-800 rounded-xl border border-gray-600 flex items-center justify-center"
                        >
                          <span className="text-2xl font-bold text-emerald-400">{digit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ This code will only be shown once. Make sure to save it somewhere safe!
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowRecoveryCode(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200"
                  >
                    I've Saved My Code
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  )
}

export default App
