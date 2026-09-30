import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { DEMO_USERS, UserProfile, UserRole } from '../types/auth.ts';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithDemo: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'c2c_active_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Restore session from localStorage or Firebase Auth on boot
  useEffect(() => {
    let isMounted = true;

    // Check localStorage first for demo sessions
    const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as UserProfile;
        if (parsed && parsed.role && parsed.email) {
          setCurrentUser(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!isMounted) return;

      if (!fbUser) {
        if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
          setCurrentUser(null);
        }
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userDocRef);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
        }

        if (userSnap && userSnap.exists()) {
          const profile = userSnap.data() as UserProfile;
          setCurrentUser(profile);
        } else {
          // If profile doc doesn't exist, create default
          const defaultRole: UserRole = fbUser.email?.includes('admin') 
            ? 'ADMIN' 
            : fbUser.email?.includes('formateur') 
            ? 'FORMATEUR' 
            : 'BÉNÉFICIAIRE';

          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'utilisateur@centre2chance.fr',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur',
            role: defaultRole,
            createdAt: new Date().toISOString(),
          };

          try {
            await setDoc(userDocRef, newProfile);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
          }
          setCurrentUser(newProfile);
        }
      } catch (err) {
        console.error('Erreur chargement profil utilisateur:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithDemo = async (targetRole: UserRole) => {
    setLoading(true);
    setError(null);

    const demo = DEMO_USERS.find(d => d.role === targetRole);
    if (!demo) {
      setError('Compte de démonstration introuvable.');
      setLoading(false);
      return;
    }

    try {
      // Build profile
      const demoProfile: UserProfile = {
        uid: `demo_${demo.role.toLowerCase()}`,
        email: demo.email,
        displayName: demo.displayName,
        role: demo.role,
        createdAt: '2026-01-01T08:00:00.000Z',
        title: demo.title,
        group: demo.group,
      };

      // Try sync profile to Firestore
      try {
        await setDoc(doc(db, 'users', demoProfile.uid), demoProfile, { merge: true });
      } catch {
        // Soft fallback for offline/unauthenticated firestore access
      }

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoProfile));
      setCurrentUser(demoProfile);
    } catch (err: unknown) {
      console.error('Erreur connexion démo:', err);
      setError('Impossible de charger le compte de démonstration.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailInput: string, passwordInput: string) => {
    setLoading(true);
    setError(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      setLoading(false);
      return;
    }

    // 1. Check if matches one of the 3 demo accounts
    const matchedDemo = DEMO_USERS.find(
      d => d.email.toLowerCase() === cleanEmail && d.password === cleanPassword
    );

    if (matchedDemo) {
      await loginWithDemo(matchedDemo.role);
      return;
    }

    // 2. Otherwise attempt standard Firebase Authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      const fbUser = userCredential.user;

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        setCurrentUser(profile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
      } else {
        const defaultRole: UserRole = cleanEmail.includes('admin')
          ? 'ADMIN'
          : cleanEmail.includes('formateur')
          ? 'FORMATEUR'
          : 'BÉNÉFICIAIRE';

        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || cleanEmail,
          displayName: fbUser.displayName || cleanEmail.split('@')[0],
          role: defaultRole,
          createdAt: new Date().toISOString(),
        };

        try {
          await setDoc(userDocRef, profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`);
        }

        setCurrentUser(profile);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch (firebaseErr: any) {
      console.error('Erreur Firebase Auth:', firebaseErr);
      const code = firebaseErr?.code;

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Adresse e-mail ou mot de passe incorrect. Vous pouvez utiliser les comptes de démonstration ci-dessous.');
      } else if (code === 'auth/too-many-requests') {
        setError('Trop de tentatives infructueuses. Veuillez patienter quelques instants.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('La connexion par e-mail/mot de passe n’est pas encore activée dans la console Firebase. Veuillez utiliser les comptes de démonstration ci-dessous.');
      } else {
        setError('Identifiants incorrects. Veuillez vérifier votre saisie ou utiliser l’un des 3 comptes de démonstration.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const role = useMemo(() => currentUser?.role || null, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        loading,
        error,
        login,
        loginWithDemo,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d’un AuthProvider');
  }
  return context;
};
