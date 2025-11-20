import React, { createContext, useState, useEffect } from 'react';
export const AuthContext = createContext();
export function AuthProvider({children}) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  useEffect(()=> localStorage.setItem('user', JSON.stringify(user)), [user]);
  return <AuthContext.Provider value={{user, setUser}}>{children}</AuthContext.Provider>
}
