import { UserIcon } from '@heroicons/react/24/outline'

function Navbar({ user, onSignOut }) {
  return (
    <nav className="bg-[#1a4d2e] shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-white">
              BeBeBank
            </span>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-white">{user.username}</span>
              </div>
              <button
                onClick={onSignOut}
                className="text-sm font-medium text-emerald-200 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar 