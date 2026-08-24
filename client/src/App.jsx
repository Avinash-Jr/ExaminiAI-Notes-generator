import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Auth from './pages/Auth.jsx'
import { useEffect } from 'react'
import { useDispatch ,useSelector } from 'react-redux'
import { getCurrentUser } from './services/api.js'
export const serverUrl = "http://localhost:8000"


const App = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector((state) => state.user) // userData is the data that is stored in the redux store
  useEffect(()=>{
    getCurrentUser(dispatch)
  },[dispatch])
  // console.log(userData)
  return (
    <>
    <Routes>
      {/* <Route path='/' element = {userData?<Home/>: <Navigate to = "/auth"/> }/>  // for redirecting to the auth page */}
            <Route path='/' element = {<Home/>}/>
      <Route path='/auth' element = {userData ? <Navigate to = "/" replace/> : <Auth/>} />
    </Routes>

     </>
  )
}

export default App