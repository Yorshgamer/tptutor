// src/auth/AuthProvider.jsx
import React from "react";
import { AuthProvider as InnerAuthProvider } from "./AuthContext";

// Este es el provider que usan TODOS los tests:
// import AuthProvider from "../src/auth/AuthProvider";
export default function AuthProvider({ children }) {
  return <InnerAuthProvider>{children}</InnerAuthProvider>;
}
