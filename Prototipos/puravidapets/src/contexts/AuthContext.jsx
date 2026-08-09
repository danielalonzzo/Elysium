import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../core/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'client', 'walker', 'admin', 'assessor'
  const [userData, setUserData] = useState(null); // Full user document from Firestore
  const [loading, setLoading] = useState(true);

  // Sign Up
  async function signup(email, password, role, additionalData = {}) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Default role assignment logic
    // Admin is specifically adrian.pochet@puravidapets.cr (but checked during login/registration)
    let assignedRole = email.toLowerCase() === 'adrian.pochet@puravidapets.cr' ? 'admin' : role;

    const userDocData = {
      uid: user.uid,
      email: user.email,
      role: assignedRole,
      createdAt: new Date().toISOString(),
      onboardingComplete: false,
      ...additionalData
    };

    // Save user role and info in Firestore
    await setDoc(doc(db, 'users', user.uid), userDocData);
    
    return userCredential;
  }

  // Log In
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Log Out
  function logout() {
    return signOut(auth);
  }

  // Reset Password
  function resetPassword(email) {
    const actionCodeSettings = {
      url: window.location.origin + '/login', // Regresar al login después de resetear
      handleCodeInApp: false
    };
    return sendPasswordResetEmail(auth, email, actionCodeSettings);
  }

  // Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch user data and role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserRole(data.role);
          setUserData(data);
        } else {
          // If no doc exists but they log in (e.g. adrian), create one or default to client
          let defaultRole = user.email.toLowerCase() === 'adrian.pochet@puravidapets.cr' ? 'admin' : 'client';
          setUserRole(defaultRole);
          const newDoc = { uid: user.uid, email: user.email, role: defaultRole, createdAt: new Date().toISOString() };
          await setDoc(userDocRef, newDoc);
          setUserData(newDoc);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    userData,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
