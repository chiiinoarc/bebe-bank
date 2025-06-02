import { motion } from 'framer-motion'
import { 
  DocumentTextIcon,
  BugAntIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const DevLog = () => {
  const navigate = useNavigate()

  const updates = [
    {
      date: '2025-05-31',
      type: 'feature',
      title: 'Project Kick-off',
      description: 'The development journey for BeBeBank officially begins.',
      icon: SparklesIcon,
      color: 'emerald'
    },
    {
      date: '2025-05-31',
      type: 'security',
      title: 'Enhanced Authentication Security',
      description: 'Implemented robust security measures for user authentication.',
      icon: ExclamationTriangleIcon,
      color: 'yellow'
    },
    {
      date: '2025-06-01',
      type: 'feature',
      title: 'Depositor Budget Features',
      description: 'Added features allowing depositors to manage their budgets.',
      icon: SparklesIcon,
      color: 'emerald'
    },
    {
      date: '2025-06-01',
      type: 'improvement',
      title: 'General UI Enhancements',
      description: 'Implemented various user interface improvements for a better look and feel.',
      icon: WrenchScrewdriverIcon,
      color: 'blue'
    },
    {
      date: '2025-06-01',
      type: 'bugfix',
      title: 'Real-time Update Fix',
      description: 'Resolved issues with real-time activity monitoring and history updates.',
      icon: BugAntIcon,
      color: 'red'
    },
    {
      date: '2025-06-01',
      type: 'update',
      title: 'Performance Optimization',
      description: 'Used specific methods to enhance database queries and performance.',
      icon: ArrowPathIcon,
      color: 'purple'
    },
    {
      date: '2025-06-02',
      type: 'improvement',
      title: 'Modernized UI',
      description: 'Updated the user interface with modern design principles and libraries.',
      icon: WrenchScrewdriverIcon,
      color: 'blue'
    }
  ]

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature':
        return 'emerald'
      case 'bugfix':
        return 'red'
      case 'improvement':
        return 'blue'
      case 'update':
        return 'purple'
      case 'security':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const getTypeTextColor = (color) => {
    switch (color) {
      case 'emerald':
        return 'text-emerald-200'
      case 'red':
        return 'text-red-200'
      case 'blue':
        return 'text-blue-200'
      case 'purple':
        return 'text-purple-200'
      case 'yellow':
        return 'text-yellow-200'
      default:
        return 'text-gray-200'
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle Grid Pattern - Keeping the layer for potential future patterns */}
      {/* <div className="absolute inset-0 z-0 opacity-5" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div> */}

      {/* Dark Overlay - Removing background color */}
      {/* <div className="absolute inset-0 z-10 bg-gray-900/50"></div> */}

      <div className="max-w-4xl mx-auto relative z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors mb-8 focus:outline-none focus:ring-2 focus:ring-gray-600 rounded"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Go Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-2xl mb-4">
            <DocumentTextIcon className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-4">
            Development Log
          </h1>
          <p className="text-gray-400 text-lg">
            Track our progress and latest updates
          </p>
        </motion.div>

        <div className="space-y-6">
          {updates.slice().reverse().map((update, index) => (
            <motion.div
              key={update.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="backdrop-blur-md rounded-lg py-4 px-6 pl-7 border border-l-2 border-gray-700 hover:border-blue-400 transition-all duration-200 ease-in-out cursor-pointer hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] origin-center group"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 bg-${update.color}-500/20 rounded`}>
                  <update.icon className={`h-6 w-6 text-${update.color}-400 group-hover:text-${update.color}-300 transition-colors duration-200`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4 pb-4 ">
                    <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-colors duration-200">{update.title}</h3>
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400 group-hover:text-gray-300 transition-colors duration-200">{new Date(update.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-200">{update.description}</p>
                  <div className="mt-4 pt-4 ">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-white/10 ${getTypeTextColor(update.color)} border border-${update.color}-400`}>
                      {update.type.charAt(0).toUpperCase() + update.type.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DevLog