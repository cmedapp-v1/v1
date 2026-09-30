export type UserRole = 'ADMIN' | 'FORMATEUR' | 'BÉNÉFICIAIRE';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  group?: string;
  title?: string;
  avatar?: string;
}

export interface DemoUser {
  email: string;
  password: string;
  role: UserRole;
  displayName: string;
  title: string;
  group?: string;
  description: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@centre2chance.fr',
    password: 'Admin2026!Password',
    role: 'ADMIN',
    displayName: 'Claire Fontaine',
    title: 'Direction & Administration',
    description: 'Accès complet : supervision générale, gestion des comptes et rapports'
  },
  {
    email: 'formateur@centre2chance.fr',
    password: 'Formateur2026!Password',
    role: 'FORMATEUR',
    displayName: 'Marc Dupuis',
    title: 'Formateur Référent Compétences Clés',
    group: 'Promo Tremplin 2026',
    description: 'Émargement, validation des présences et suivi de groupe'
  },
  {
    email: 'beneficiaire@centre2chance.fr',
    password: 'Beneficiaire2026!Password',
    role: 'BÉNÉFICIAIRE',
    displayName: 'Yasmine Benali',
    title: 'Stagiaire de la Deuxième Chance',
    group: 'Promo Tremplin 2026 - Groupe A',
    description: 'Consultation assiduité, déclaration d’absences et justificatifs'
  }
];
