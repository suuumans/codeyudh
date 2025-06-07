
// import { useEffect } from 'react'
// import { Routes, Route, Navigate } from 'react-router-dom'
// import HomePage from './pages/HomePage.tsx'
// import LoginPage from './pages/LoginPage.tsx'
// import SignUpPage from './pages/SignUpPage.tsx'
// import { Toaster } from 'react-hot-toast'
// import { useAuthStore } from './store/useAuthStore.ts'
// import { Loader } from 'lucide-react'
// import type { AuthStore } from './types/authStoreType.ts'
// import Layout from './components/Layout.tsx'
// import ProblemPage from './pages/ProblemPage.tsx'
// import AdminRoute from './components/AdminRoute.tsx'
// import { AddProblem } from './pages/AddProblem.tsx'
// import Profile from './pages/Profile.tsx'
// import LandingPage from './pages/LandingPage.tsx'



// function App() {

//   const { authUser, checkAuth, isCheckingAuth } = useAuthStore() as AuthStore

//   useEffect(() => {
//     checkAuth()
//   }, [checkAuth])

//   if(isCheckingAuth && !authUser){
//     return (
//       <div className='flex flex-col items-center justify-center h-screen'>
//         <Loader className='size-10 animate-spin'/>
//       </div>
//     )
//   }

//   console.log("Auth User:", authUser);
  

//   return (
//     <div className='flex flex-col items-center justify-start'>
//       <Toaster/>
//       {/* <Navbar/> */}
//       <Toaster />
//       <Routes>
//         <Route path="/" element={<Layout />}>
//           <Route path="/" element={<LandingPage />} />
//           <Route index element={authUser ? <HomePage /> : <Navigate to="/login" />} />
//           <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/home" />} />
//           <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/home" />} />
//           <Route path="/problem/:id" element={authUser ? <ProblemPage /> : <Navigate to="/login" />} />
//           <Route element={<AdminRoute />}>
//           <Route path="/add-problem" element={<AddProblem />} /></Route>
//           <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
//         </Route>
//       </Routes>

//     </div>
//   )
// }

// export default App



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
import { AddProblem } from './pages/AddProblem.tsx'
import Profile from './pages/Profile.tsx'
import LandingPage from './pages/LandingPage.tsx'
import CreateContestPage from './pages/CreateContestPage.tsx'
import ContestPage from './pages/ContestPage.tsx'
import SheetsPage from './pages/Sheetspage.tsx'

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
      <Routes>
          <Route index element={<LandingPage />} />
        <Route path="/" element={<Layout />}>
          <Route path="/home" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/home" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/home" />} />
          <Route path="/problem/:id" element={authUser ? <ProblemPage /> : <Navigate to="/login" />} />
          <Route element={<AdminRoute />}>
            <Route path="/add-problem" element={<AddProblem />} />
            <Route path="/create-contest" element={<CreateContestPage />} />
          </Route>
          <Route path="/sheets" element={authUser ? <SheetsPage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/contest" element={authUser ? <ContestPage /> : <Navigate to="/login" />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
