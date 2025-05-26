
import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.tsx'



const Layout = () => {
  return (
    <div>
        <Navbar/>
        <Outlet/>
    </div>
  )
}

export default Layout