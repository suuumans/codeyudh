
import { User, Code, LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.ts";
import { Link } from "react-router-dom";
import type { AuthStore } from "../types/authStoreType.ts";
import LogoutButton from "./LogoutButton";

const Navbar = () => {

  const { authUser } = useAuthStore() as AuthStore

  return (
    <nav className="sticky top-0 z-50 w-full py-3 md:py-5 px-2 md:px-0">
      <div className="flex w-full justify-between items-center mx-auto max-w-4xl bg-black/15 shadow-lg shadow-neutral-600/5 backdrop-blur-lg border border-gray-200/10 px-3 py-2 sm:p-3 md:p-4 rounded-xl md:rounded-2xl">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0">
          {/* Mobile: Show code icon, Desktop: Show brand name */}
          <Code className="w-5 h-5 sm:hidden text-primary" />
          <span className="hidden sm:block text-lg md:text-2xl font-bold tracking-tight text-white">
          codeyudh
          </span>
        </Link>

        {/* Main Navigation Links */}
        <div className="flex items-center gap-4 sm:gap-5 md:gap-9">
          <Link to="/home" className="text-white text-xs sm:text-sm font-medium leading-normal whitespace-nowrap">Problems</Link>
          {/* <Link to="/contest" className="text-white text-xs sm:text-sm font-medium leading-normal whitespace-nowrap">Contests</Link> */}
          <Link to="/sheets" className="text-white text-xs sm:text-sm font-medium leading-normal whitespace-nowrap">Sheets</Link>
        </div>

        {/* User Profile and Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 shrink-0">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar flex flex-row p-0">
              <div className="w-8 sm:w-10 rounded-full">
                <img
                  src={
                    authUser?.image ||
                    "https://avatar.iran.liara.run/public/boy"
                  }
                  alt="User Avatar"
                  className="object-cover"
                />
              </div>
           
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 space-y-3"
            >
              {/* Admin Option */}
             

              {/* Common Options */}
              <li>
                <p className="text-base font-semibold">
                 
                  {authUser?.name}

                </p>
                <hr className="border-gray-200/10" />
              </li>
              <li>
                <Link
                  to="/profile"
                  className="hover:bg-primary hover:text-white text-base font-semibold"
                >
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Link>
              </li>
              {authUser?.role === "ADMIN" && (
                <>
                  <li>
                    <Link
                      to="/add-problem"
                      className="hover:bg-primary hover:text-white text-base font-semibold"
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Add Problem
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/create-contest"
                      className="hover:bg-primary hover:text-white text-base font-semibold"
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Create Contest
                    </Link>
                  </li>
                </>
              )}
              <li>
                <LogoutButton className="hover:bg-primary hover:text-white">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </LogoutButton>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  )
}


export default Navbar