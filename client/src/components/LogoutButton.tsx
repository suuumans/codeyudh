
import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import type { AuthStore } from "../types/authStoreType";

type LogoutButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const LogoutButton = ({ children, className, ...props }: LogoutButtonProps) => {
  const { logout } = useAuthStore() as AuthStore;

  const onLogout = async () => {
    await logout();
  };

  return (
    <button onClick={onLogout} className="btn btn-primary">
      Logout
    </button>
  );
}

export default LogoutButton