import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertCircle } from 'lucide-react'
import { DatabaseService } from '@/lib/database'
import { toast } from 'sonner'

interface AddSessionFormProps {
  onSessionAdded: () => void
}

export default function AddSessionForm({ onSessionAdded }: AddSessionFormProps) {
  const [form, setForm] = useState({
    completed: '',
    correct: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const completed = parseInt(form.completed)
    const correct = parseInt(form.correct)

    // Validation
    if (isNaN(completed) || isNaN(correct)) {
      setError('Please enter valid numbers')
      return
    }

    if (completed <= 0) {
      setError('Questions completed must be greater than 0')
      return
    }

    if (correct < 0) {
      setError('Correct answers cannot be negative')
      return
    }

    if (correct > completed) {
      setError('Correct answers cannot exceed total questions')
      return
    }

    setLoading(true)

    try {
      await DatabaseService.addSession(completed, correct)
      
      // Reset form
      setForm({ completed: '', correct: '' })
      
      // Show success message
      const accuracy = ((correct / completed) * 100).toFixed(1)
      toast.success(`Session added! ${completed} questions with ${accuracy}% accuracy`)
      
      // Notify parent component
      onSessionAdded()
    } catch (err: any) {
      setError(err.message || 'Failed to add session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg rounded-lg bg-gradient-to-br from-white/80 via-white/90 to-white/80 dark:from-slate-900/80 dark:via-slate-900/90 dark:to-slate-900/80 backdrop-blur-sm border border-white/20 dark:border-slate-800/20">
      <CardHeader className="border-b p-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 dark:from-purple-900/20 dark:to-blue-900/20">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Plus className="w-5 h-5 text-amber-500" />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Add Session
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="completed" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Questions Completed
            </label>
            <Input
              id="completed"
              type="number"
              placeholder="Enter number of questions"
              value={form.completed}
              onChange={(e) => setForm(prev => ({ ...prev, completed: e.target.value }))}
              min="1"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="correct" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Correct Answers
            </label>
            <Input
              id="correct"
              type="number"
              placeholder="Enter number of correct answers"
              value={form.correct}
              onChange={(e) => setForm(prev => ({ ...prev, correct: e.target.value }))}
              min="0"
              max={form.completed || undefined}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
            disabled={loading}
          >
            {loading ? 'Adding Session...' : 'Add Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}