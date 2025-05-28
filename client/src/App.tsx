
import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import SignUpPage from './pages/SignUpPage.tsx'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/useAuthStore.ts'
import { Loader } from 'lucide-react'
import type { AuthStore } from './types/authStoreType.ts'
import Layout from './components/Layout.tsx'
import ProblemPage from './pages/ProblemPage.tsx'
import AdminRoute from './components/AdminRoute.tsx'
import { AddProblem } from './pages/AddProble.tsx'
import Profile from './pages/Profile.tsx'



function App() {

  const { authUser, checkAuth, isCheckingAuth } = useAuthStore() as AuthStore

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if(isCheckingAuth && !authUser){
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <Loader className='size-10 animate-spin'/>
      </div>
    )
  }

  console.log("Auth User:", authUser);
  

  return (
    <div className='flex flex-col items-center justify-start'>
      <Toaster/>
      {/* <Navbar/> */}
      <Toaster />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/problem/:id" element={authUser ? <ProblemPage /> : <Navigate to="/login" />} />
          <Route element={<AdminRoute />}>
            <Route path="/add-problem" element={authUser ? <AddProblem /> : <Navigate to="/login" />} />
          </Route>
          <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
        </Route>
      </Routes>

    </div>
  )
}

export default App