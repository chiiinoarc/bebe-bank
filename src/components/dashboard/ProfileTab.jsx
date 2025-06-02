import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { db } from '../../firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore'
import {
  UserCircleIcon,
  TrophyIcon,
  StarIcon,
  BanknotesIcon,
  FlagIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const achievements = [
  {
    id: 'first_deposit',
    title: 'First Deposit',
    description: 'Made your first deposit',
    icon: BanknotesIcon,
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    id: 'savings_milestone',
    title: 'Savings Milestone',
    description: 'Reached ₱10,000 in savings',
    icon: ChartBarIcon,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'goal_achiever',
    title: 'Goal Achiever',
    description: 'Completed your first savings goal',
    icon: FlagIcon,
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'consistent_saver',
    title: 'Consistent Saver',
    description: 'Saved consistently for 30 days',
    icon: StarIcon,
    color: 'bg-amber-100 text-amber-600'
  }
]

function ProfileTab({ user }) {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [unlockedAchievements, setUnlockedAchievements] = useState([])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id))
        if (userDoc.exists()) {
          setUserData(userDoc.data())
          // Check for achievements
          const userAchievements = []
          
          // First deposit achievement
          if (userDoc.data().firstDeposit) {
            userAchievements.push('first_deposit')
          }
          
          // Savings milestone achievement
          if (userDoc.data().balance >= 10000) {
            userAchievements.push('savings_milestone')
          }
          
          // Goal achiever (we'll implement this later)
          // Consistent saver (we'll implement this later)
          
          setUnlockedAchievements(userAchievements)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching user data:', error)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <UserCircleIcon className="h-12 w-12 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{userData?.username}</h2>
            <p className="text-sm text-gray-500">Member since {userData?.createdAt?.toDate().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-xl font-bold text-gray-900">₱{userData?.balance || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FlagIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Goals</p>
              <p className="text-xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Achievements</p>
              <p className="text-xl font-bold text-gray-900">{unlockedAchievements.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id)
            const Icon = achievement.icon
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  isUnlocked 
                    ? 'border-emerald-200 bg-emerald-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full ${achievement.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{achievement.title}</h4>
                    <p className="text-xs text-gray-500">{achievement.description}</p>
                  </div>
                  {isUnlocked && (
                    <div className="ml-auto">
                      <StarIcon className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ProfileTab 