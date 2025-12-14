import { useState } from "react"
import { useAuthStore } from "../stores/use-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Lock, Mail, User } from "lucide-react"

export function LoginPage() {
    const { login, register, resetPassword } = useAuthStore()
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login')
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccessMsg(null)

        if (view === 'login') {
            const { error: authError } = await login(email, password)
            if (authError) {
                setError(authError.message || "Login failed")
                setLoading(false)
            }
        } else if (view === 'register') {
            const { error: authError } = await register(email, password, username)
            if (authError) {
                setError(authError.message || "Registration failed")
                setLoading(false)
            } else {
                setSuccessMsg("Account created! You can now log in.")
                setView('login')
                setLoading(false)
                setPassword("")
                setUsername("")
            }
        } else if (view === 'forgot') {
            const { error: authError } = await resetPassword(email)
            if (authError) {
                setError(authError.message || "Failed to send reset email")
                setLoading(false)
            } else {
                setSuccessMsg("Password reset email sent! Check your inbox.")
                setLoading(false)
            }
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted/20">
            <Card className="w-full max-w-sm shadow-lg border-muted/60">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2 text-indigo-600">
                        {view === 'forgot' ? <Mail className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {view === 'login' && "LogiBook Cloud"}
                        {view === 'register' && "Create Account"}
                        {view === 'forgot' && "Reset Password"}
                    </CardTitle>
                    <CardDescription>
                        {view === 'login' && "Sign in to your account"}
                        {view === 'register' && "Enter your details below"}
                        {view === 'forgot' && "Enter your email to receive recovery link"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            {view === 'register' && (
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="pl-9"
                                        required
                                        minLength={3}
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                            {view !== 'forgot' && (
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-9"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            )}
                            {error && <p className="text-xs text-center text-rose-500 font-medium animate-pulse">{error}</p>}
                            {successMsg && <p className="text-xs text-center text-emerald-600 font-medium animate-pulse">{successMsg}</p>}
                        </div>

                        {view === 'login' && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setView('forgot')}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                            {loading ? "Processing..." : (
                                view === 'login' ? "Sign In" :
                                    view === 'register' ? "Create Account" : "Send Reset Link"
                            )}
                        </Button>

                        <div className="text-center space-y-2">
                            {view !== 'register' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView('register')
                                        setError(null)
                                        setSuccessMsg(null)
                                    }}
                                    className="block w-full text-xs text-muted-foreground hover:text-indigo-600 hover:underline transition-colors"
                                >
                                    Don't have an account? Sign up
                                </button>
                            )}
                            {view !== 'login' && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setView('login')
                                        setError(null)
                                        setSuccessMsg(null)
                                    }}
                                    className="block w-full text-xs text-muted-foreground hover:text-indigo-600 hover:underline transition-colors"
                                >
                                    Back to Sign In
                                </button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
