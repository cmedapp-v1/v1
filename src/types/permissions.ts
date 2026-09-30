import { UserRole } from './auth.ts';

export type PermissionAction = 
  | 'show'                // 👁️ Afficher : la rubrique apparaît dans le menu
  | 'read'                // 📖 Lire / Consulter : voir les informations
  | 'create'              // ➕ Ajouter
  | 'update'              // ✏️ Modifier
  | 'delete'              // 🗑️ Supprimer
  | 'import'              // 📥 Importer
  | 'export'              // 📤 Exporter
  | 'print'               // 🖨️ Imprimer
  | 'validate'            // ✅ Valider
  | 'correct_attendance'; // 🔄 Modifier / corriger une présence

export type RubricId = 
  | 'eleves'
  | 'presences'
  | 'absences'
  | 'justificatifs'
  | 'rapports'
  | 'import_export'
  | 'utilisateurs'
  | 'parametres';

export interface RubricDefinition {
  id: RubricId;
  label: string;
  description: string;
  iconName: string;
  availableActions: PermissionAction[];
}

export const ALL_PERMISSION_ACTIONS: { id: PermissionAction; label: string; icon: string }[] = [
  { id: 'show', label: 'Afficher', icon: '👁️' },
  { id: 'read', label: 'Lire / Consulter', icon: '📖' },
  { id: 'create', label: 'Ajouter', icon: '➕' },
  { id: 'update', label: 'Modifier', icon: '✏️' },
  { id: 'delete', label: 'Supprimer', icon: '🗑️' },
  { id: 'import', label: 'Importer', icon: '📥' },
  { id: 'export', label: 'Exporter', icon: '📤' },
  { id: 'print', label: 'Imprimer', icon: '🖨️' },
  { id: 'validate', label: 'Valider', icon: '✅' },
  { id: 'correct_attendance', label: 'Corriger présence', icon: '🔄' },
];

export const RUBRICS_LIST: RubricDefinition[] = [
  {
    id: 'eleves',
    label: 'Élèves / Bénéficiaires',
    description: 'Fiches d’identification, MASSAR, scolarité et dossiers',
    iconName: 'Users',
    availableActions: ['show', 'read', 'create', 'update', 'delete', 'import', 'export', 'print'],
  },
  {
    id: 'presences',
    label: 'Pointage des Présences',
    description: 'Émargement des séances par jour, formation et groupe',
    iconName: 'ClipboardList',
    availableActions: ['show', 'read', 'create', 'update', 'delete', 'export', 'print', 'validate', 'correct_attendance'],
  },
  {
    id: 'absences',
    label: 'Registre des Absences',
    description: 'Suivi global des absences, signalements et bilans',
    iconName: 'CalendarCheck',
    availableActions: ['show', 'read', 'create', 'update', 'delete', 'export', 'print', 'validate'],
  },
  {
    id: 'justificatifs',
    label: 'Justificatifs & Décisions',
    description: 'Validation des certificats médicaux et pièces justificatives',
    iconName: 'FileCheck2',
    availableActions: ['show', 'read', 'create', 'update', 'delete', 'print', 'validate'],
  },
  {
    id: 'rapports',
    label: 'Rapports & Statistiques',
    description: 'Bilans institutionnels, taux d’assiduité et exports officiels',
    iconName: 'BarChart3',
    availableActions: ['show', 'read', 'export', 'print'],
  },
  {
    id: 'import_export',
    label: 'Import / Export de Données',
    description: 'Traitements massifs Excel (.xlsx) et CSV (.csv)',
    iconName: 'ArrowUpDown',
    availableActions: ['show', 'read', 'import', 'export'],
  },
  {
    id: 'utilisateurs',
    label: 'Gestion Utilisateurs & Droits',
    description: 'Administration des comptes et attribution des permissions',
    iconName: 'Shield',
    availableActions: ['show', 'read', 'create', 'update', 'delete'],
  },
  {
    id: 'parametres',
    label: 'Paramètres du Centre',
    description: 'Configuration générale de l’établissement',
    iconName: 'Settings',
    availableActions: ['show', 'read', 'update'],
  },
];

export type UserRubricPermissions = Record<RubricId, Partial<Record<PermissionAction, boolean>>>;

export type GroupScope = 'ALL' | 'ASSIGNED_ONLY';
export type TrainingScope = 'ALL' | 'ASSIGNED_ONLY';
export type StudentScope = 'ALL' | 'GROUP_STUDENTS_ONLY' | 'OWN_ONLY';

export interface DataScopeLimits {
  groupScope: GroupScope;
  trainingScope: TrainingScope;
  studentScope: StudentScope;
}

export interface UserCustomPermissions {
  rubrics: UserRubricPermissions;
  dataScope: DataScopeLimits;
  updatedAt?: string;
  updatedBy?: string;
}

// Default Presets
export function getDefaultPermissionsForRole(role: UserRole): UserCustomPermissions {
  if (role === 'ADMIN') {
    const rubrics: UserRubricPermissions = {} as any;
    RUBRICS_LIST.forEach(r => {
      rubrics[r.id] = {};
      r.availableActions.forEach(act => {
        rubrics[r.id][act] = true;
      });
    });

    return {
      rubrics,
      dataScope: {
        groupScope: 'ALL',
        trainingScope: 'ALL',
        studentScope: 'ALL',
      },
    };
  }

  if (role === 'FORMATEUR') {
    return {
      rubrics: {
        eleves: { show: true, read: true, create: false, update: false, delete: false, import: false, export: false, print: true },
        presences: { show: true, read: true, create: true, update: true, delete: false, export: true, print: true, validate: true, correct_attendance: true },
        absences: { show: true, read: true, create: true, update: false, delete: false, export: false, print: false, validate: false },
        justificatifs: { show: true, read: true, create: false, update: false, delete: false, print: false, validate: false },
        rapports: { show: true, read: true, export: false, print: true },
        import_export: { show: false, read: false, import: false, export: false },
        utilisateurs: { show: false, read: false, create: false, update: false, delete: false },
        parametres: { show: false, read: false, update: false },
      },
      dataScope: {
        groupScope: 'ASSIGNED_ONLY',
        trainingScope: 'ASSIGNED_ONLY',
        studentScope: 'GROUP_STUDENTS_ONLY',
      },
    };
  }

  // BÉNÉFICIAIRE
  return {
    rubrics: {
      eleves: { show: true, read: true, create: false, update: false, delete: false, import: false, export: false, print: true },
      presences: { show: true, read: true, create: false, update: false, delete: false, export: false, print: false, validate: false, correct_attendance: false },
      absences: { show: true, read: true, create: true, update: false, delete: false, export: false, print: false, validate: false },
      justificatifs: { show: true, read: true, create: true, update: false, delete: false, print: false, validate: false },
      rapports: { show: false, read: false, export: false, print: false },
      import_export: { show: false, read: false, import: false, export: false },
      utilisateurs: { show: false, read: false, create: false, update: false, delete: false },
      parametres: { show: false, read: false, update: false },
    },
    dataScope: {
      groupScope: 'ASSIGNED_ONLY',
      trainingScope: 'ASSIGNED_ONLY',
      studentScope: 'OWN_ONLY',
    },
  };
}
