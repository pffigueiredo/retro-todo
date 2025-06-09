
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit3, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Form state for creating new todos
  const [newTodoForm, setNewTodoForm] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Form state for editing todos
  const [editForm, setEditForm] = useState<{ title: string; description: string }>({
    title: '',
    description: ''
  });

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoForm.title.trim()) return;
    
    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(newTodoForm);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNewTodoForm({ title: '', description: null });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleEditTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editForm.title.trim()) return;

    try {
      const updateData: UpdateTodoInput = {
        id: editingTodo.id,
        title: editForm.title,
        description: editForm.description || null
      };
      
      const updatedTodo = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === editingTodo.id ? updatedTodo : t)
      );
      setEditingTodo(null);
      setEditForm({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingTodo(todo);
    setEditForm({
      title: todo.title,
      description: todo.description || ''
    });
  };

  const cancelEditing = () => {
    setEditingTodo(null);
    setEditForm({ title: '', description: '' });
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Retro Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 mb-4 font-mono tracking-wider">
            ✨ TODO MASTER ✨
          </h1>
          <div className="text-xl text-purple-200 font-mono">
            {totalCount > 0 && (
              <Badge variant="secondary" className="bg-purple-800/50 text-purple-100 border-purple-600 text-lg px-4 py-2">
                {completedCount}/{totalCount} completed 🎯
              </Badge>
            )}
          </div>
          <div className="mt-4 text-purple-300 font-mono text-lg">
            ∙ RETRO TASK MANAGEMENT SYSTEM ∙
          </div>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 bg-gradient-to-r from-purple-800/30 to-blue-800/30 border-purple-500/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-purple-100 font-mono flex items-center gap-2">
              <Plus className="h-6 w-6 text-pink-400" />
              ADD NEW MISSION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <Input
                placeholder="Enter your mission title..."
                value={newTodoForm.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoForm((prev: CreateTodoInput) => ({ 
                    ...prev, 
                    title: e.target.value 
                  }))
                }
                className="bg-purple-900/50 border-purple-400/50 text-purple-100 placeholder-purple-300 font-mono text-lg"
                required
              />
              <Textarea
                placeholder="Mission details (optional)..."
                value={newTodoForm.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewTodoForm((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                className="bg-purple-900/50 border-purple-400/50 text-purple-100 placeholder-purple-300 font-mono resize-none"
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !newTodoForm.title.trim()}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-mono text-lg px-8 py-3 disabled:opacity-50"
              >
                {isLoading ? '⚡ PROCESSING...' : '🚀 LAUNCH MISSION'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Edit Todo Modal */}
        {editingTodo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-gradient-to-br from-purple-800 to-blue-800 border-purple-400">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-100 font-mono flex items-center gap-2">
                  <Edit3 className="h-6 w-6 text-cyan-400" />
                  EDIT MISSION
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditTodo} className="space-y-4">
                  <Input
                    placeholder="Mission title..."
                    value={editForm.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="bg-purple-900/50 border-purple-400/50 text-purple-100 placeholder-purple-300 font-mono"
                    required
                  />
                  <Textarea
                    placeholder="Mission details..."
                    value={editForm.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setEditForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="bg-purple-900/50 border-purple-400/50 text-purple-100 placeholder-purple-300 font-mono resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-mono flex-1"
                    >
                      💾 SAVE
                    </Button>
                    <Button 
                      type="button"
                      onClick={cancelEditing}
                      variant="outline"
                      className="border-purple-400 text-purple-100 hover:bg-purple-800/50 font-mono flex-1"
                    >
                      ❌ CANCEL
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Todo List */}
        {todos.length === 0 ? (
          <Card className="bg-gradient-to-r from-purple-800/20 to-blue-800/20 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🌟</div>
              <p className="text-2xl text-purple-200 font-mono">NO MISSIONS YET</p>
              <p className="text-purple-300 font-mono mt-2">Create your first todo above to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`transition-all duration-300 backdrop-blur-sm ${
                  todo.completed 
                    ? 'bg-gradient-to-r from-green-800/20 to-teal-800/20 border-green-500/50' 
                    : 'bg-gradient-to-r from-purple-800/30 to-blue-800/30 border-purple-500/50'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(todo)}
                      className="mt-1 transition-colors hover:scale-110 transform duration-200"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-purple-400 hover:text-purple-300" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-mono font-semibold ${
                          todo.completed 
                            ? 'text-green-200 line-through' 
                            : 'text-purple-100'
                        }`}>
                          {todo.title}
                        </h3>
                        {todo.completed && (
                          <Badge className="bg-green-600/50 text-green-100 border-green-500 font-mono">
                            ✅ COMPLETE
                          </Badge>
                        )}
                      </div>
                      
                      {todo.description && (
                        <p className={`text-base font-mono mb-3 ${
                          todo.completed 
                            ? 'text-green-300/80 line-through' 
                            : 'text-purple-200'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      
                      <div className="text-sm text-purple-400 font-mono">
                        📅 Created: {todo.created_at.toLocaleDateString()} {todo.created_at.toLocaleTimeString()}
                        {todo.updated_at.getTime() !== todo.created_at.getTime() && (
                          <span className="ml-4">
                            🔄 Updated: {todo.updated_at.toLocaleDateString()} {todo.updated_at.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEditing(todo)}
                        variant="outline"
                        size="sm"
                        className="border-cyan-400/50 text-cyan-300 hover:bg-cyan-800/30 hover:text-cyan-200 font-mono"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-400/50 text-red-300 hover:bg-red-800/30 hover:text-red-200 font-mono"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gradient-to-br from-purple-800 to-red-800 border-red-400">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-100 font-mono text-xl">
                              🗑️ DELETE MISSION
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-red-200 font-mono">
                              Are you sure you want to delete "{todo.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-purple-400 text-purple-100 hover:bg-purple-800/50 font-mono">
                              CANCEL
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-mono"
                            >
                              DELETE
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <div className="text-purple-400 font-mono text-lg">
            ∙∙∙ POWERED BY RETRO TECH ∙∙∙
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
