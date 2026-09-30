import { UserProfile, UserRole } from '../types/auth.ts';
import { 
  RubricId, 
  PermissionAction, 
  UserCustomPermissions, 
  getDefaultPermissionsForRole 
} from '../types/permissions.ts';
import { Student } from '../types/student.ts';
import { ImportExportService } from './importExportService.ts';
import { db } from '../lib/firebase.ts';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

const STORAGE_KEY_USERS = 'c2c_all_users_v1';

// Initial users seeded from DEMO_USERS
const INITIAL_SYSTEM_USERS: UserProfile[] = [
  {
    uid: 'demo_admin',
    email: 'admin@centre2chance.fr',
    displayName: 'Claire Fontaine',
    role: 'ADMIN',
    title: 'Direction & Administration',
    group: 'Tous les groupes',
    createdAt: '2026-01-01T08:00:00.000Z',
    customPermissions: getDefaultPermissionsForRole('ADMIN'),
  },
  {
    uid: 'demo_formateur',
    email: 'formateur@centre2chance.fr',
    displayName: 'Marc Dupuis',
    role: 'FORMATEUR',
    title: 'Formateur Référent Compétences Clés',
    group: 'Promo Tremplin 2026 - Groupe A',
    assignedTraining: 'Développement Web & Clés Métiers',
    createdAt: '2026-01-01T08:00:00.000Z',
    customPermissions: getDefaultPermissionsForRole('FORMATEUR'),
  },
  {
    uid: 'demo_beneficiaire',
    email: 'beneficiaire@centre2chance.fr',
    displayName: 'Yasmine Benali',
    role: 'BÉNÉFICIAIRE',
    title: 'Stagiaire de la Deuxième Chance',
    group: 'Promo Tremplin 2026 - Groupe A',
    assignedTraining: 'Développement Web & Clés Métiers',
    studentId: 'student_001',
    createdAt: '2026-01-01T08:00:00.000Z',
    customPermissions: getDefaultPermissionsForRole('BÉNÉFICIAIRE'),
  }
];

function getStoredUsers(): UserProfile[] {
  const data = localStorage.getItem(STORAGE_KEY_USERS);
  if (!data) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_SYSTEM_USERS));
    return INITIAL_SYSTEM_USERS;
  }
  try {
    return JSON.parse(data) as UserProfile[];
  } catch {
    return INITIAL_SYSTEM_USERS;
  }
}

function setStoredUsers(users: UserProfile[]) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

export const PermissionService = {
  // 1. Get resolved permissions for a user
  getUserPermissions(user: UserProfile | null): UserCustomPermissions {
    if (!user) {
      return getDefaultPermissionsForRole('BÉNÉFICIAIRE');
    }
    if (user.customPermissions && user.customPermissions.rubrics) {
      return user.customPermissions;
    }
    return getDefaultPermissionsForRole(user.role);
  },

  // 2. Strict Action Check
  canPerformAction(user: UserProfile | null, rubric: RubricId, action: PermissionAction): boolean {
    if (!user) return false;

    const perms = this.getUserPermissions(user);
    const rubricPerms = perms.rubrics[rubric];
    if (!rubricPerms) return false;

    // Rule 1: Si Afficher = ❌, la rubrique ne doit pas apparaître
    if (action === 'show') {
      return rubricPerms.show === true;
    }

    // Rule 2: Si Afficher = ❌, aucune action n'est permise
    if (rubricPerms.show !== true) {
      return false;
    }

    // Rule 3: Si Lire = ❌, impossible de lire ou d'exécuter des sous-actions
    if (action === 'read') {
      return rubricPerms.read === true;
    }

    // Rule 4: Pour toute action (create, update, delete, etc.), la lecture doit être autorisée
    if (rubricPerms.read !== true) {
      return false;
    }

    return rubricPerms[action] === true;
  },

  // 3. Data Scopes
  canAccessGroup(user: UserProfile | null, groupName: string): boolean {
    if (!user) return false;
    const perms = this.getUserPermissions(user);
    if (perms.dataScope.groupScope === 'ALL') return true;

    if (!user.group) return false;
    return user.group.trim().toLowerCase() === groupName.trim().toLowerCase();
  },

  canAccessTraining(user: UserProfile | null, trainingName: string): boolean {
    if (!user) return false;
    const perms = this.getUserPermissions(user);
    if (perms.dataScope.trainingScope === 'ALL') return true;

    if (!user.assignedTraining) return true; // if not restricted
    return user.assignedTraining.trim().toLowerCase() === trainingName.trim().toLowerCase();
  },

  canAccessStudent(user: UserProfile | null, student: Student): boolean {
    if (!user) return false;
    const perms = this.getUserPermissions(user);
    const scope = perms.dataScope.studentScope;

    if (scope === 'ALL') return true;

    if (scope === 'GROUP_STUDENTS_ONLY') {
      if (!user.group) return false;
      return student.group?.trim().toLowerCase() === user.group.trim().toLowerCase();
    }

    if (scope === 'OWN_ONLY') {
      const matchEmail = Boolean(user.email && student.email && user.email.toLowerCase() === student.email.toLowerCase());
      const matchId = Boolean(student.id === 'student_001' && user.email.includes('beneficiaire'));
      return matchEmail || matchId;
    }

    return false;
  },

  // 4. Get all users (sync from Firestore when available)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const firestoreUsers: UserProfile[] = [];
        snap.forEach(d => {
          firestoreUsers.push(d.data() as UserProfile);
        });
        
        // Merge with defaults if missing
        const currentLocal = getStoredUsers();
        currentLocal.forEach(lu => {
          if (!firestoreUsers.some(fu => fu.uid === lu.uid || fu.email === lu.email)) {
            firestoreUsers.push(lu);
          }
        });
        setStoredUsers(firestoreUsers);
        return firestoreUsers;
      }
    } catch (err) {
      console.warn('Lecture users Firestore échouée, bascule locale:', err);
    }
    return getStoredUsers();
  },

  // 5. Save Custom Permissions for a User
  async saveUserCustomPermissions(
    targetUserId: string,
    newPermissions: UserCustomPermissions,
    adminUser: UserProfile
  ): Promise<UserProfile | null> {
    const users = await this.getAllUsers();
    const index = users.findIndex(u => u.uid === targetUserId || u.email === targetUserId);
    if (index === -1) return null;

    const targetUser = users[index];
    const updatedPermissions: UserCustomPermissions = {
      ...newPermissions,
      updatedAt: new Date().toISOString(),
      updatedBy: `${adminUser.displayName} (${adminUser.email})`,
    };

    const updatedUser: UserProfile = {
      ...targetUser,
      customPermissions: updatedPermissions,
    };

    users[index] = updatedUser;
    setStoredUsers(users);

    // If target user is the currently active local session, update active session!
    const activeSessionStr = localStorage.getItem('c2c_active_session');
    if (activeSessionStr) {
      try {
        const active = JSON.parse(activeSessionStr) as UserProfile;
        if (active.uid === targetUser.uid || active.email === targetUser.email) {
          localStorage.setItem('c2c_active_session', JSON.stringify(updatedUser));
          window.dispatchEvent(new CustomEvent('c2c_user_updated', { detail: updatedUser }));
        }
      } catch (e) {}
    }

    // Sync to Firestore
    try {
      await setDoc(doc(db, 'users', targetUser.uid), updatedUser, { merge: true });
    } catch (err) {
      console.warn('Sauvegarde Firestore permissions échouée:', err);
    }

    // Save to Activity Journal
    await ImportExportService.logActivity({
      id: `log_perm_${Date.now()}`,
      type: 'IMPORT',
      userName: adminUser.displayName,
      userEmail: adminUser.email,
      format: 'Permissions',
      recordCount: 1,
      importMode: `Attribution droits personnalisés`,
      filtersUsed: `Droits mis à jour pour ${targetUser.displayName} (${targetUser.role})`,
      timestamp: new Date().toISOString(),
    });

    return updatedUser;
  },

  // 6. Create a new user with default or custom permissions
  async createUser(
    userData: {
      displayName: string;
      email: string;
      role: UserRole;
      title?: string;
      group?: string;
      assignedTraining?: string;
    },
    adminUser: UserProfile
  ): Promise<UserProfile> {
    const users = await this.getAllUsers();
    const cleanEmail = userData.email.trim().toLowerCase();

    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error(`Un utilisateur avec l'adresse e-mail ${cleanEmail} existe déjà.`);
    }

    const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const defaultPerms = getDefaultPermissionsForRole(userData.role);

    const newUser: UserProfile = {
      uid,
      email: cleanEmail,
      displayName: userData.displayName.trim(),
      role: userData.role,
      title: userData.title?.trim() || (userData.role === 'ADMIN' ? 'Direction' : userData.role === 'FORMATEUR' ? 'Formateur' : 'Stagiaire'),
      group: userData.group?.trim() || (userData.role === 'ADMIN' ? 'Tous les groupes' : 'Promo Tremplin 2026 - Groupe A'),
      assignedTraining: userData.assignedTraining?.trim() || 'Développement Web & Clés Métiers',
      createdAt: new Date().toISOString(),
      customPermissions: defaultPerms,
    };

    users.push(newUser);
    setStoredUsers(users);

    try {
      await setDoc(doc(db, 'users', uid), newUser);
    } catch (err) {
      console.warn('Sauvegarde Firestore du nouvel utilisateur échouée:', err);
    }

    await ImportExportService.logActivity({
      id: `log_user_create_${Date.now()}`,
      type: 'IMPORT',
      userName: adminUser.displayName,
      userEmail: adminUser.email,
      format: 'Utilisateur',
      recordCount: 1,
      importMode: `Création de compte ${userData.role}`,
      filtersUsed: `Création du compte ${newUser.displayName} (${newUser.email})`,
      timestamp: new Date().toISOString(),
    });

    return newUser;
  },

  // 7. Update an existing user
  async updateUser(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    const users = await this.getAllUsers();
    const index = users.findIndex(u => u.uid === userId || u.email === userId);
    if (index === -1) return null;

    const updatedUser: UserProfile = {
      ...users[index],
      ...updates,
    };

    users[index] = updatedUser;
    setStoredUsers(users);

    const activeSessionStr = localStorage.getItem('c2c_active_session');
    if (activeSessionStr) {
      try {
        const active = JSON.parse(activeSessionStr) as UserProfile;
        if (active.uid === updatedUser.uid || active.email === updatedUser.email) {
          localStorage.setItem('c2c_active_session', JSON.stringify(updatedUser));
          window.dispatchEvent(new CustomEvent('c2c_user_updated', { detail: updatedUser }));
        }
      } catch (e) {}
    }

    try {
      await setDoc(doc(db, 'users', updatedUser.uid), updatedUser, { merge: true });
    } catch (err) {
      console.warn('Sauvegarde Firestore mise à jour utilisateur:', err);
    }

    return updatedUser;
  },

  // 8. Delete a user
  async deleteUser(userId: string): Promise<boolean> {
    let users = await this.getAllUsers();
    const index = users.findIndex(u => u.uid === userId || u.email === userId);
    if (index === -1) return false;

    users = users.filter(u => u.uid !== userId && u.email !== userId);
    setStoredUsers(users);
    return true;
  }
};
