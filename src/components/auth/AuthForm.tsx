import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle, BookOpen } from 'lucide-react'

export default function AuthForm() {
  const { signIn, signUp, loading } = useAuth()
  const [error, setError] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

  const [signInForm, setSignInForm] = useState({
    email: '',
    password: '',
  })

  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await signIn(signInForm.email, signInForm.password)
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (signUpForm.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      await signUp(signUpForm.email, signUpForm.password, signUpForm.username, signUpForm.displayName)
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-blue-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              QBank Tracker
            </CardTitle>
          </div>
          <CardDescription>
            Track your progress and achieve your goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={signInForm.email}
                    onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={signInForm.password}
                    onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={signUpForm.username}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Display Name"
                    value={signUpForm.displayName}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, displayName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={signUpForm.confirmPassword}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}