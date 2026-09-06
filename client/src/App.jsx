import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import { useEffect } from 'react'
import { useDispatch ,useSelector } from 'react-redux'
import { getCurrentUser } from './services/api.js'
export const serverUrl = "http://localhost:8000"
import { useState } from 'react'
import Pricing from './pages/Pricing.jsx'
import History from './pages/History.jsx'
import Contact from './pages/Contact.jsx'
import Layout from './components/Layout.jsx'
import Notes from './pages/Notes.jsx'
import About from './pages/About.jsx'
import Terms from './pages/Terms.jsx'
import Privacy from './pages/Privacy.jsx'
import Settings from './pages/Settings.jsx'
import TopicForm from './pages/TopicForm.jsx'


const App = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user) // userData is the data that is stored in the redux store

  // Important: don't redirect to /auth before checking the existing cookie.
  const [authLoading, setAuthLoading] = useState(true);

  // One call only — this used to run in a second effect as well, which fired
  // two /currentuser requests and two dispatches on every mount.
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
      <div className="min-h-screen flex items-center justify-center bg-amber-100">
        <div className="text-xl font-semibold">Checking authentication...</div>
      </div>
    );
  }

  return (
    <Routes>
            <Route path='/' element = {<Home/>}/>
      {/* <Route path='/' element = {userData?<Home/>: <Navigate to = "/auth"/> }/>  // for redirecting to the auth page */}
      <Route path='/auth' element = {userData ? <Navigate to = "/" replace/> : <Auth/>} />
      <Route path='/pricing' element = {userData ? <Navigate to = "/" replace/> : <Pricing/>} />

      {/* Content pages share the Layout shell: header, page nav, footer.
          History and Contact used to redirect signed-in users away, which made
          them unreachable for everyone who was logged in — that guard is gone. */}
      <Route element={<Layout />}>
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/privacy' element={<Privacy />} />

        {/* Notes and History show one account's own content, so gate them once
            auth is switched back on above:
            element={userData ? <Notes/> : <Navigate to="/auth" replace/>} */}
        <Route path='/notes' element={<Notes />} />
        <Route path='/history' element={<History />} />

        {/* Settings needs no guard here: it renders its own "sign in first"
            state, which keeps the URL working when someone arrives from a
            bookmark with an expired cookie. */}
        <Route path='/settings' element={<Settings />} />

        {/* The brief arrives here in router state from the generate dialog. The
            page handles arriving without one, so the URL stays shareable. */}
        <Route path='/topic-form' element={<TopicForm />} />
      </Route>
    </Routes>

  )
}

export default App