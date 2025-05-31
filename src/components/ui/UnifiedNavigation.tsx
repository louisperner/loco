import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Package, 
  MessageSquare, 
  Bot,
  LogOut,
  UserPlus,
  ChevronRight,
  Home,
  Maximize2,
  Zap,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAIChatStore } from '@/store/useAIChatStore';
import { useInterviewAssistantStore } from '@/store/interviewAssistantStore';
import { useGameStore } from '@/store/useGameStore';

interface NavigationSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  action?: () => void;
  submenu?: NavigationItem[];
  isActive?: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
}

const UnifiedNavigation: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  
  const { currentUser, signOut, toggleAuthModal } = useAuthStore();
  const { toggleVisibility: toggleAIChat, isVisible: isAIChatVisible } = useAIChatStore();
  const { setVisible: setInterviewAssistantVisible, isVisible: isInterviewAssistantVisible } = useInterviewAssistantStore();
  const { setShowInventory, showInventory, setShowSettings, showSettings } = useGameStore();

  // Auto-collapse on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.unified-navigation') && isExpanded) {
        setIsExpanded(false);
        setActiveSection(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            setShowSettings(!showSettings);
            break;
          case 'i':
            e.preventDefault();
            setShowInventory(!showInventory);
            break;
          case 'c':
            e.preventDefault();
            toggleAIChat();
            break;
          case 'a':
            e.preventDefault();
            setInterviewAssistantVisible(!isInterviewAssistantVisible);
            break;
          case 'n':
            e.preventDefault();
            setIsExpanded(!isExpanded);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings, showInventory, isAIChatVisible, isInterviewAssistantVisible, isExpanded]);

  const navigationSections: NavigationSection[] = [
    {
      id: 'user',
      label: currentUser ? currentUser.displayName || currentUser.email || 'User' : 'Sign In',
      icon: <User size={18} />,
      isActive: !!currentUser,
      submenu: currentUser ? [
        {
          id: 'profile',
          label: 'Profile',
          icon: <User size={16} />,
          action: () => {
            // Open profile modal/page
            // console.log('Open profile');
          }
        },
        {
          id: 'logout',
          label: 'Sign Out',
          icon: <LogOut size={16} />,
          action: () => {
            signOut();
            setIsExpanded(false);
          }
        }
      ] : [
        {
          id: 'login',
          label: 'Sign In',
          icon: <UserPlus size={16} />,
          action: () => {
            toggleAuthModal(true);
            setIsExpanded(false);
          }
        }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <Package size={18} />,
      isActive: showInventory,
      action: () => {
        setShowInventory(!showInventory);
        setIsExpanded(false);
      }
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: <MessageSquare size={18} />,
      badge: isAIChatVisible ? '●' : undefined,
      isActive: isAIChatVisible,
      action: () => {
        toggleAIChat();
        setIsExpanded(false);
      }
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: <Bot size={18} />,
      badge: isInterviewAssistantVisible ? '●' : undefined,
      isActive: isInterviewAssistantVisible,
      action: () => {
        setInterviewAssistantVisible(!isInterviewAssistantVisible);
        setIsExpanded(false);
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={18} />,
      isActive: showSettings,
      submenu: [
        {
          id: 'general',
          label: 'General Settings',
          icon: <Settings size={16} />,
          action: () => {
            setShowSettings(!showSettings);
            setIsExpanded(false);
          }
        },
        {
          id: 'appearance',
          label: 'Appearance',
          icon: <Eye size={16} />,
          action: () => {
            // Open appearance settings
            // console.log('Open appearance settings');
          }
        },
        {
          id: 'shortcuts',
          label: 'Keyboard Shortcuts',
          icon: <Zap size={16} />,
          action: () => {
            // Show shortcuts help
            // console.log('Show shortcuts');
          }
        }
      ]
    }
  ];

  const handleSectionClick = (section: NavigationSection) => {
    if (section.action) {
      section.action();
    } else if (section.submenu) {
      setActiveSection(activeSection === section.id ? null : section.id);
    }
  };

  const quickActions = [
    {
      id: 'toggle-inventory',
      icon: <Package size={14} />,
      label: 'Inventory',
      action: () => setShowInventory(!showInventory),
      isActive: showInventory
    },
    {
      id: 'toggle-chat',
      icon: <MessageSquare size={14} />,
      label: 'AI Chat',
      action: () => toggleAIChat(),
      isActive: isAIChatVisible
    },
    {
      id: 'toggle-assistant',
      icon: <Bot size={14} />,
      label: 'Assistant',
      action: () => setInterviewAssistantVisible(!isInterviewAssistantVisible),
      isActive: isInterviewAssistantVisible
    }
  ];

  if (isMinimized) {
    return (
      <div className="unified-navigation fixed top-1 right-0 z-10">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-10 h-10 bg-[#2c2c2c]/95 backdrop-blur-sm border border-[#151515] rounded-lg shadow-lg flex items-center justify-center text-white/90 hover:bg-[#3c3c3c] transition-all duration-200 hover:scale-105"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    );
  }

      return (
      <div className="unified-navigation fixed top-1 right-0 z-40">

      {/* Main Navigation Button */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={() => setQuickActionsVisible(true)}
          onMouseLeave={() => setQuickActionsVisible(false)}
          className={`absolute top-1 right-1 w-12 h-12 bg-[#2c2c2c]/95 backdrop-blur-sm border border-[#151515] rounded-lg shadow-lg flex items-center justify-center text-white/90 hover:bg-[#3c3c3c] transition-all duration-200 hover:scale-105 ${
            isExpanded ? 'bg-[#3c3c3c] scale-105' : ''
          }`}
        >
          <div className="flex items-center justify-center">
            {currentUser ? (
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-inner">
                {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
              </div>
            ) : (
              <User size={18} />
            )}
          </div>
          
          {/* Status indicators */}
          <div className="absolute -bottom-1 -right-1 flex gap-0.5">
            {isAIChatVisible && (
              <div className="w-2 h-2 bg-green-500 rounded-full border border-[#2c2c2c] animate-pulse"></div>
            )}
            {isInterviewAssistantVisible && (
              <div className="w-2 h-2 bg-blue-500 rounded-full border border-[#2c2c2c] animate-pulse"></div>
            )}
          </div>
        </button>

                  {/* Expanded Navigation Panel */}
          {isExpanded && (
            <div className="absolute top-14 right-0 w-80 md:w-72 lg:w-80 bg-[#2c2c2c]/98 backdrop-blur-md border border-[#151515] rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200 bg-[#232025]">
            {/* Header */}
            <div className="p-4 border-b border-[#151515] bg-gradient-to-r from-[#2c2c2c] to-[#3c3c3c]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Home size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Navigation</h3>
                    <p className="text-xs text-white/60">Quick access to all features</p>
                  </div>
                </div>
                {/* <button
                  onClick={() => setIsMinimized(true)}
                  className="w-7 h-7 rounded-lg hover:bg-[#4c4c4c] flex items-center justify-center text-white/60 hover:text-white/90 transition-all duration-200"
                >
                  <Minimize2 size={13} />
                </button> */}
              </div>
            </div>

            {/* Navigation Items */}
            <div className="py-2">
              {navigationSections.map((section, index) => (
                <div key={section.id} className={`transition-all duration-200 ${index > 0 ? 'border-t border-[#151515]/50' : ''}`}>
                  <button
                    onClick={() => handleSectionClick(section)}
                    className={`w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#3c3c3c] transition-all duration-200 group ${
                      activeSection === section.id ? 'bg-[#3c3c3c]' : ''
                    } ${section.isActive ? 'bg-[#7d3296]/20 border-r-2 border-[#7d3296]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                        section.isActive 
                          ? 'bg-[#7d3296] text-white' 
                          : 'text-white/70 group-hover:bg-[#4c4c4c] group-hover:text-white/90'
                      }`}>
                        {section.icon}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-white/90">{section.label}</span>
                        {section.isActive && (
                          <span className="text-xs text-[#7d3296] font-medium">Active</span>
                        )}
                      </div>
                      {section.badge && (
                        <span className="text-xs text-green-400 font-medium bg-green-400/20 px-2 py-0.5 rounded-full">
                          {section.badge}
                        </span>
                      )}
                    </div>
                    {section.submenu && (
                      <ChevronRight 
                        size={16} 
                        className={`text-white/40 transition-transform duration-200 ${
                          activeSection === section.id ? 'rotate-90' : ''
                        }`} 
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {section.submenu && activeSection === section.id && (
                    <div className="bg-[#252525] border-t border-[#151515] animate-in slide-in-from-top-1 duration-150">
                      {section.submenu.map((item) => (
                        <button
                          key={item.id}
                          onClick={item.action}
                          className="w-full px-6 py-3 flex items-center gap-3 hover:bg-[#3c3c3c] transition-all duration-200 group"
                        >
                          {item.icon && (
                            <div className="text-white/50 group-hover:text-white/70 transition-colors duration-200">
                              {item.icon}
                            </div>
                          )}
                          <span className="text-sm text-white/80 group-hover:text-white/95 transition-colors duration-200">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#151515] bg-[#252525]">
              <div className="text-xs text-white/50 space-y-1.5">
                <div className="font-medium text-white/70 mb-2">Keyboard Shortcuts</div>
                <div className="grid grid-cols-2 gap-1">
                  <div>Alt + S → Settings</div>
                  <div>Alt + I → Inventory</div>
                  <div>Alt + C → AI Chat</div>
                  <div>Alt + A → Assistant</div>
                  <div>Alt + N → Navigation</div>
                  <div>F → Chat (in game)</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Quick Actions Bar */}
        <div className={`mr-16 mt-1 flex gap-1 transition-all duration-300 ${quickActionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              title={action.label}
              className={`w-8 h-8 rounded-md border border-[#151515] backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                action.isActive 
                  ? 'bg-[#7d3296] text-white shadow-lg active-glow' 
                  : 'bg-[#2c2c2c]/95 text-white/70 hover:bg-[#3c3c3c] hover:text-white/90'
              }`}
            >
              {action.icon}
            </button>
          ))}
        </div>
    </div>
  );
};

export default UnifiedNavigation; 