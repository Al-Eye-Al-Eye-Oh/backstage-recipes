import { Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import RecipeList from './pages/RecipeList'
import RecipeForm from './pages/RecipeForm'
import RecipeDetail from './pages/RecipeDetail'
import ScaleView from './pages/ScaleView'
import ImportRecipe from './pages/ImportRecipe'

export default function App() {
  return (
    <div className="min-h-screen bg-surface-900 max-w-md mx-auto relative">
      <Routes>
        <Route path="/" element={<Navigate to="/recipes" replace />} />
        <Route path="/recipes" element={<RecipeList />} />
        <Route path="/recipes/new" element={<RecipeForm />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/recipes/:id/edit" element={<RecipeForm />} />
        <Route path="/recipes/:id/scale" element={<ScaleView />} />
        <Route path="/import" element={<ImportRecipe />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
