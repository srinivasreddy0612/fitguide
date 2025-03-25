"use client"
import React, { useState } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import Link from 'next/link';
import ResetConfirmationModal from './ResetConfirmationModal';

interface NavbarProps {
  showChatbot: boolean;
  toggleChatbot: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ showChatbot, toggleChatbot }) => {
  const [showResetModal, setShowResetModal] = useState(false);

  // Function to show reset confirmation modal
  const handleShowResetModal = () => {
    setShowResetModal(true);
  };

  // Function to close reset confirmation modal
  const handleCloseResetModal = () => {
    setShowResetModal(false);
  };

  return (
    <>
      <nav className="backdrop-blur-md bg-black/20 border-b border-white/5 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">FitGuide</div>
          <div className="flex items-center space-x-6">
            <SignedIn>
              {/* Reset Plan Button */}
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:text-white/90 transition-colors text-white/80"
                onClick={handleShowResetModal}
              >
                <div className="p-2 rounded-full bg-white/5 backdrop-blur-sm">
                  <RefreshCw size={18} className="text-white/80" />
                </div>
                <span className="font-light text-sm">Reset Plan</span>
              </div>

              {/* AI Coach Button */}
              <div 
                className={`flex items-center space-x-2 cursor-pointer hover:text-white/90 transition-colors ${showChatbot ? 'text-white' : 'text-white/80'}`}
                onClick={toggleChatbot}
              >
                <div className={`p-2 rounded-full ${showChatbot ? 'bg-white/20' : 'bg-white/5'} backdrop-blur-sm`}>
                  <Brain size={18} className={showChatbot ? 'text-white' : 'text-white/80'} />
                </div>
                <span className="font-light text-sm">AI Coach</span>
              </div>
              
              {/* User Button */}
              <div className="cursor-pointer p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/15 transition-colors text-white/90 text-sm font-medium">
                  Sign In
                </div>
              </Link>
            </SignedOut>
          </div>
        </div>
      </nav>
      
      {/* Reset Confirmation Modal */}
      <ResetConfirmationModal 
        isOpen={showResetModal} 
        onClose={handleCloseResetModal} 
      />
    </>
  );
};

export default Navbar;