
import {
  auth,
  db,
  googleProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  doc,
  getDoc,
  setDoc
} from './firebase.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userRole = 'viewer';
    this.authCallbacks = [];
    this.init();
  }

  init() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadUserRole(user);
      } else {
        this.userRole = 'viewer';
      }
      this.notifyAuthChange();
    });
  }

  async loadUserRole(user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create new user document
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          role: "member", // Default role
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await setDoc(userRef, userData);
        this.userRole = "member";
      } else {
        const userData = userSnap.data();
        this.userRole = userData.role || "member";
        
        // Update last login
        await setDoc(userRef, {
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error loading user role:", error);
      this.userRole = "viewer";
    }
  }

  // Google Sign In
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Email Sign In
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Register with Email
  async registerWithEmail(email, password, displayName = null) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Sign Out
  async signOut() {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Check if user has admin role
  isAdmin() {
    return this.userRole === 'admin';
  }

  // Check if user has member role or higher
  isMember() {
    return ['member', 'admin'].includes(this.userRole);
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authCallbacks.push(callback);
  }

  // Notify all subscribers of auth changes
  notifyAuthChange() {
    this.authCallbacks.forEach(callback => {
      callback({
        user: this.currentUser,
        role: this.userRole,
        isAuthenticated: this.isAuthenticated(),
        isAdmin: this.isAdmin(),
        isMember: this.isMember()
      });
    });
  }

  // Get user-friendly error messages
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/invalid-email': 'Invalid email address',
      'auth/email-already-in-use': 'Email already registered',
      'auth/weak-password': 'Password too weak (min 6 characters)',
      'auth/operation-not-allowed': 'Operation not allowed',
      'auth/user-disabled': 'This account has been disabled'
    };
    return errorMessages[errorCode] || 'Authentication failed';
  }
}

// Create global auth manager instance
export const authManager = new AuthManager();