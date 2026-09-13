import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import { useEffect } from 'react'
import { useDispatch ,useSelector } from 'react-redux'
import { getCurrentUser } from './services/api.js'
export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"
import { useState } from 'react'
import Pricing from './pages/Pricing.jsx'
import History from './pages/History.jsx'
import Contact from './pages/Contact.jsx'
import Layout from './components/Layout.jsx'
import AppShell from './components/AppShell/AppShell.jsx'
import Notes from './pages/Notes.jsx'
import About from './pages/About.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import Settings from './pages/Settings.jsx'
import TopicForm from './pages/TopicForm.jsx'
import Payment from './pages/Payment.jsx'
import NotFound from './pages/NotFound.jsx'

const App = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user)

  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser(dispatch);
      } catch (error) {
        console.error("Failed to get current user:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkUser();
  }, [dispatch]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-sheet text-ink gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <div className="text-sm font-medium text-ink-2 tracking-wide">Initializing ExaminAI...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/auth' element={userData ? <Navigate to="/notes" replace /> : <Auth />} />
      <Route path='/pricing' element={<Pricing />} />

      {/* Public informational pages share the marketing Layout shell */}
      <Route element={<Layout />}>
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/privacy' element={<Privacy />} />
      </Route>

      {/* Authenticated / Workspace pages share the AppShell dashboard */}
      <Route element={<AppShell />}>
        <Route path='/notes' element={<Notes />} />
        <Route path='/history' element={<History />} />
        <Route path='/settings' element={<Settings />} />
        <Route path='/topic-form' element={<TopicForm />} />
        <Route path='/payment' element={<Payment />} />
      </Route>

      {/* 404 catch-all — must be last */}
      <Route path='*' element={<NotFound />} />
    </Routes>

  )
}

export default App