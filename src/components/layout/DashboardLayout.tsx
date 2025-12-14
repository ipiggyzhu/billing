import * as React from "react"
import { cn } from "../../lib/utils"
import { PlusCircle, List, User, PanelLeft, TrendingUp, LogOut, Lock, Mail } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "../ui/button"
import { useAuthStore } from "../../stores/use-auth"


import {
    PanelResizeHandle,
    Panel,
    PanelGroup,
    type ImperativePanelHandle
} from "react-resizable-panels"

interface DashboardLayoutProps {
    children: React.ReactNode
    activeTab: 'list' | 'create' | 'stats'
    onTabChange: (tab: 'list' | 'create' | 'stats') => void
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
    const sidebarRef = React.useRef<ImperativePanelHandle>(null)
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const { logout, user } = useAuthStore()

    const toggleSidebar = () => {
        const panel = sidebarRef.current
        if (panel) {
            if (isCollapsed) {
                panel.expand()
            } else {
                panel.collapse()
            }
        }
    }

    return (
        <div className="h-screen w-full bg-background text-foreground overflow-hidden">
            <PanelGroup direction="horizontal">
                {/* Sidebar Panel */}
                <Panel
                    ref={sidebarRef}
                    defaultSize={20}
                    minSize={15}
                    maxSize={40}
                    collapsible={true}
                    collapsedSize={0}
                    onCollapse={() => setIsCollapsed(true)}
                    onExpand={() => setIsCollapsed(false)}
                    className={cn(
                        "bg-card/50 backdrop-blur-xl border-r flex flex-col overflow-hidden",
                        // Only animate when NOT dragging to ensure resizing is responsive
                        !isDragging && "transition-[flex-grow,flex-basis,min-width] duration-300 ease-in-out"
                    )}
                >
                    {/* Inner container with fixed min-width to prevent content squashing during collapse */}
                    <div className="flex flex-col h-full w-full min-w-[240px]">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent truncate">
                                LogiBook
                            </h1>
                            <p className="text-xs text-muted-foreground mt-1 truncate">Smart Freight Ledger</p>
                        </div>

                        <nav className="flex-1 px-4 space-y-2 overflow-hidden">
                            <button
                                onClick={() => onTabChange('list')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent/50 whitespace-nowrap",
                                    activeTab === 'list' ? "bg-accent/80 text-accent-foreground shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <List size={18} className="shrink-0" />
                                Shipments
                            </button>
                            <button
                                onClick={() => onTabChange('create')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent/50 whitespace-nowrap",
                                    activeTab === 'create' ? "bg-accent/80 text-accent-foreground shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <PlusCircle size={18} className="shrink-0" />
                                New Entry
                            </button>
                            <button
                                onClick={() => onTabChange('stats')}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:bg-accent/50 whitespace-nowrap",
                                    activeTab === 'stats' ? "bg-accent/80 text-accent-foreground shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <TrendingUp size={18} className="shrink-0" />
                                Statistics
                            </button>
                        </nav>




                        <div className="p-4 border-t">
                            <div className="flex items-center justify-between px-2 overflow-hidden mb-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                        <User size={16} />
                                    </div>
                                    <div className="flex flex-col truncate">
                                        <span className="text-sm font-medium truncate" title={user?.email}>
                                            {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {user?.email === 'ipiggyzhu@gmail.com' ? 'Admin' : 'Member'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={logout} className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors" title="Logout">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </Panel>

                <PanelResizeHandle
                    className="w-1 bg-border hover:bg-primary/50 transition-colors"
                    onDragging={setIsDragging}
                />

                {/* Main Content Panel */}
                <Panel defaultSize={80}>
                    <div className="flex flex-col h-full min-w-0 overflow-hidden relative">
                        {/* Toggle Button - Gemini Style */}
                        <div className="absolute top-4 left-4 z-50">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSidebar}
                                className="text-muted-foreground hover:text-foreground bg-background/50 backdrop-blur-sm"
                            >
                                <PanelLeft size={20} />
                            </Button>
                        </div>

                        <header className="h-16 border-b flex items-center px-6 md:hidden">
                            {/* Mobile Header with same functionality potentially */}
                            <h1 className="text-lg font-bold ml-12">LogiBook</h1>
                        </header>
                        <div className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-14">
                            <div className="max-w-5xl mx-auto">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    >
                                        {children}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </Panel>
            </PanelGroup>
        </div>
    )
}

