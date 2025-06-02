import { useState } from 'react'
import { db } from '../firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { ArrowLeftIcon, UserIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'

function Register({ onBack }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [focused, setFocused] = useState({
    username: false,
    password: false,
    confirmPassword: false
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      // Check if username already exists
      const userDocRef = doc(db, 'users', formData.username.toLowerCase())
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        setError('Username already exists')
        return
      }

      // Create new user document
      await setDoc(userDocRef, {
        username: formData.username.toLowerCase(),
        password: formData.password, // Store password as string
        role: 'depositor',
        balance: 0,
        createdAt: new Date()
      })

      setSuccess(true)
      setTimeout(() => {
        onBack()
      }, 2000)
    } catch (error) {
      console.error('Error registering:', error)
      setError('Error registering')
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f9f4] relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHoiIGZpbGw9IiMxYTdkMmUiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-[#1a4d2e] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-[#2d6a4f] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-[#40916c] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a4d2e] to-[#2d6a4f] shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative px-4 py-10 bg-white/95 backdrop-blur-sm shadow-lg sm:rounded-3xl sm:p-20"
            >
              <div className="max-w-md mx-auto">
                <div className="divide-y divide-gray-200">
                  <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex justify-center items-center mb-8"
                    >
                      <h2 className="text-2xl font-bold text-emerald-800">Register Depositor</h2>
                    </motion.div>
                    
                    {error && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4"
                      >
                        <p className="font-medium">{error}</p>
                      </motion.div>
                    )}
                    
                    {success && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-md mb-4"
                      >
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          <p className="font-medium">{success}</p>
                        </div>
                      </motion.div>
                    )}

                    <motion.form 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      onSubmit={handleSubmit} 
                      className="space-y-6"
                    >
                      <div className="relative">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className={`h-5 w-5 transition-colors duration-200 ${focused.username ? 'text-emerald-500' : 'text-emerald-400'}`} />
                          </div>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            onFocus={() => setFocused(prev => ({ ...prev, username: true }))}
                            onBlur={() => setFocused(prev => ({ ...prev, username: false }))}
                            className={`pl-10 pr-4 py-3 block w-full rounded-lg border-2 transition-all duration-200 ${
                              focused.username 
                                ? 'border-emerald-500 ring-2 ring-emerald-200' 
                                : 'border-emerald-200 hover:border-emerald-300'
                            } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200`}
                            placeholder=" "
                            required
                          />
                          <label 
                            className={`absolute left-10 transition-all duration-200 pointer-events-none ${
                              formData.username || focused.username
                                ? '-top-2.5 left-2 text-xs text-emerald-600 bg-white px-1'
                                : 'top-3 text-gray-500'
                            }`}
                          >
                            Username
                          </label>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className={`h-5 w-5 transition-colors duration-200 ${focused.password ? 'text-emerald-500' : 'text-emerald-400'}`} />
                          </div>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onFocus={() => setFocused(prev => ({ ...prev, password: true }))}
                            onBlur={() => setFocused(prev => ({ ...prev, password: false }))}
                            className={`pl-10 pr-4 py-3 block w-full rounded-lg border-2 transition-all duration-200 ${
                              focused.password 
                                ? 'border-emerald-500 ring-2 ring-emerald-200' 
                                : 'border-emerald-200 hover:border-emerald-300'
                            } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200`}
                            placeholder=" "
                            required
                          />
                          <label 
                            className={`absolute left-10 transition-all duration-200 pointer-events-none ${
                              formData.password || focused.password
                                ? '-top-2.5 left-2 text-xs text-emerald-600 bg-white px-1'
                                : 'top-3 text-gray-500'
                            }`}
                          >
                            Password
                          </label>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className={`h-5 w-5 transition-colors duration-200 ${focused.confirmPassword ? 'text-emerald-500' : 'text-emerald-400'}`} />
                          </div>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onFocus={() => setFocused(prev => ({ ...prev, confirmPassword: true }))}
                            onBlur={() => setFocused(prev => ({ ...prev, confirmPassword: false }))}
                            className={`pl-10 pr-4 py-3 block w-full rounded-lg border-2 transition-all duration-200 ${
                              focused.confirmPassword 
                                ? 'border-emerald-500 ring-2 ring-emerald-200' 
                                : 'border-emerald-200 hover:border-emerald-300'
                            } focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200`}
                            placeholder=" "
                            required
                          />
                          <label 
                            className={`absolute left-10 transition-all duration-200 pointer-events-none ${
                              formData.confirmPassword || focused.confirmPassword
                                ? '-top-2.5 left-2 text-xs text-emerald-600 bg-white px-1'
                                : 'top-3 text-gray-500'
                            }`}
                          >
                            Confirm Password
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 hover:shadow-md"
                        >
                          Register Depositor
                        </motion.button>
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={onBack}
                          className="w-full inline-flex justify-center items-center px-4 py-3 border border-gray-200 text-sm font-medium rounded-lg text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
                        >
                          <ArrowLeftIcon className="h-5 w-5 mr-2" />
                          Return to Login
                        </motion.button>
                      </div>
                    </motion.form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register 