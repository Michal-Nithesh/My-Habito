import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/authStore"
import toast from "react-hot-toast"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { signUp, signInWithGoogle, loading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match"
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    if (password.length < 6) {
      const errorMsg = "Password must be at least 6 characters"
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    try {
      await signUp(email, password)
      toast.success("Account created successfully! Please check your email to verify your account.")
      navigate("/dashboard")
    } catch (err: any) {
      let errorMessage = "Failed to create account. Please try again."
      
      // Check for specific error messages
      if (err.message?.includes("already registered") || err.message?.includes("already exists")) {
        errorMessage = "This email is already registered. Please sign in instead."
      } else if (err.message?.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address."
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      toast.success("Signing up with Google...")
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up with Google")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Habito Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-habito-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#16A34A] mb-2">Habito</h1>
          <p className="text-muted-foreground text-sm mb-6">Build better habits, achieve your goals</p>
          <h2 className="text-2xl font-semibold text-foreground">Create your account</h2>
        </div>

        <form
          className="mt-8 space-y-5 bg-card rounded-2xl shadow-habito p-6 border border-border"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium mb-2">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium mb-2">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20"
                placeholder="Min. 6 characters"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-medium py-3 px-6 rounded-xl shadow-habito transition-all duration-200 hover:shadow-habito-lg"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground font-medium">Or continue with</span>
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full border-2 font-medium py-3 px-4 rounded-xl shadow-sm hover:shadow-habito transition-all duration-200 flex items-center justify-center gap-2 bg-transparent"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </Button>
          </div>

          <div className="text-center">
            <span className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-[#16A34A] hover:text-[#15803D] transition-colors">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
