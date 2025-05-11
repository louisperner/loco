import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

interface UserProfileProps {
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { currentUser, signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    if (onClose) {
      onClose();
    }
  };

  if (!currentUser) {
    return null;
  }

  // Extract username from email or use UID if not available
  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="bg-[#222222] text-white p-4 rounded-lg w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">User Profile</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            &times;
          </button>
        )}
      </div>

      <div className="flex items-center mb-6">
        {currentUser.photoURL ? (
          <img 
            src={currentUser.photoURL} 
            alt="Profile" 
            className="w-16 h-16 rounded-full mr-4"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#7d3296] flex items-center justify-center mr-4">
            <span className="text-xl font-semibold">{userInitial}</span>
          </div>
        )}
        <div>
          <p className="font-medium text-lg">{displayName}</p>
          <p className="text-gray-400 text-sm">{currentUser.email}</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full bg-[#7d3296] hover:bg-[#9149a8] text-white py-2 px-4 rounded transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 