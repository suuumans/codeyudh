
import React from 'react'
import { useAuthStore } from '../store/useAuthStore'
import type { AuthStore } from '../types/authStoreType'
import { Loader } from 'lucide-react'

const AdminRoute = () => {

    const { authUser, isCheckingAuth } = useAuthStore() as AuthStore
    if(isCheckingAuth){
        return <div className='flex items-center justify-center h-screen'><Loader className='size-10 animate-spin'/></div>
    }

    if(!authUser || authUser.role !== "admin"){
        return <div className='flex items-center justify-center h-screen'>You are not authorized to access this page</div>
    }
  return (
    <div>AdminRoute</div>
  )
}

export default AdminRoute;