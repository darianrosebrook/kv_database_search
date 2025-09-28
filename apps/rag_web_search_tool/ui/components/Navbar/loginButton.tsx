/**
 * Login button component for navbar
 */
import React from "react";
import { Button } from "../Button";
import styles from "./loginButton.module.scss";

export interface LoginButtonProps {
  onLogin?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  className?: string;
}

export const LoginButton: React.FC<LoginButtonProps> = ({
  onLogin,
  onLogout,
  isAuthenticated = false,
  className = "",
}) => {
  return (
    <div className={`${styles.loginButton} ${className}`}>
      {isAuthenticated ? (
        <Button variant="outline" size="sm" onClick={onLogout}>
          Logout
        </Button>
      ) : (
        <Button variant="primary" size="sm" onClick={onLogin}>
          Login
        </Button>
      )}
    </div>
  );
};

export default LoginButton;
