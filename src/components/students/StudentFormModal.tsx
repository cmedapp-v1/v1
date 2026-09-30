import React, { useState, useEffect } from 'react';
import { 
  Student, 
  SchoolLevel, 
  StudentStatus, 
  Gender, 
  AVAILABLE_TRAININGS, 
  AVAILABLE_GROUPS, 
  AVAILABLE_TRAINERS, 
  AVAILABLE_ROOMS 
} from '../../types/student.ts';
import { StudentService } from '../../services/studentService.ts';
import { 
  X, 
  Save, 
  User, 
  GraduationCap, 
  Calendar, 
  Users, 
  AlertCircle, 
  Sparkles, 
  Camera, 
  Check, 
  RefreshCw 
} from 'lucide-react';

interface StudentFormModalProps {
  existingStudents: Student[];
  studentToEdit?: Student | null;
  onClose: () => void;
  onSaved: (student: Student) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  existingStudents,
  studentToEdit,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(studentToEdit);
  const [activeTab, setActiveTab] = useState<'identification' | 'scolaire' | 'inscription' | 'responsable'>('identification');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [id, setId] = useState<string>(studentToEdit?.id || `student_${Date.now()}`);
  const [registrationNumber, setRegistrationNumber] = useState<string>(
    studentToEdit?.registrationNumber || StudentService.generateNextRegistrationNumber(existingStudents)
  );
  const [massarNumber, setMassarNumber] = useState<string>(studentToEdit?.massarNumber || '');
  const [lastName, setLastName] = useState<string>(studentToEdit?.lastName || '');
  const [firstName, setFirstName] = useState<string>(studentToEdit?.firstName || '');
  const [lastNameArabic, setLastNameArabic] = useState<string>(studentToEdit?.lastNameArabic || '');
  const [firstNameArabic, setFirstNameArabic] = useState<string>(studentToEdit?.firstNameArabic || '');
  const [photoUrl, setPhotoUrl] = useState<string>(studentToEdit?.photoUrl || '');
  const [birthDate, setBirthDate] = useState<string>(studentToEdit?.birthDate || '2006-01-01');
  const [birthPlace, setBirthPlace] = useState<string>(studentToEdit?.birthPlace || 'Casablanca');
  const [gender, setGender] = useState<Gender>(studentToEdit?.gender || 'Homme');
  const [cin, setCin] = useState<string>(studentToEdit?.cin || '');
  const [phone, setPhone] = useState<string>(studentToEdit?.phone || '');
  const [address, setAddress] = useState<string>(studentToEdit?.address || '');
  const [city, setCity] = useState<string>(studentToEdit?.city || 'Casablanca');

  // Niveau scolaire
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>(studentToEdit?.schoolLevel || '3ème année collège');
  const [schoolLevelOther, setSchoolLevelOther] = useState<string>(studentToEdit?.schoolLevelOther || '');

  // Inscription
  const [registrationDate, setRegistrationDate] = useState<string>(
    studentToEdit?.registrationDate || new Date().toISOString().split('T')[0]
  );
  const [trainingYear, setTrainingYear] = useState<string>(studentToEdit?.trainingYear || '2025-2026');
  const [training, setTraining] = useState<string>(studentToEdit?.training || AVAILABLE_TRAININGS[0]);
  const [group, setGroup] = useState<string>(studentToEdit?.group || AVAILABLE_GROUPS[0]);
  const [trainer, setTrainer] = useState<string>(studentToEdit?.trainer || AVAILABLE_TRAINERS[0]);
  const [room, setRoom] = useState<string>(studentToEdit?.room || AVAILABLE_ROOMS[0]);
  const [status, setStatus] = useState<StudentStatus>(studentToEdit?.status || 'Actif');

  // Responsable
  const [guardianName, setGuardianName] = useState<string>(studentToEdit?.guardianName || '');
  const [guardianRelation, setGuardianRelation] = useState<string>(studentToEdit?.guardianRelation || 'Père');
  const [guardianPhone, setGuardianPhone] = useState<string>(studentToEdit?.guardianPhone || '');
  const [guardianPhoneSecondary, setGuardianPhoneSecondary] = useState<string>(studentToEdit?.guardianPhoneSecondary || '');
  const [guardianAddress, setGuardianAddress] = useState<string>(studentToEdit?.guardianAddress || '');

  const handleRegenerateRegNumber = () => {
    setRegistrationNumber(StudentService.generateNextRegistrationNumber(existingStudents));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!registrationNumber.trim()) {
      setError("Le N° d'inscription est obligatoire.");
      setActiveTab('identification');
      return;
    }

    if (!massarNumber.trim()) {
      setError("Le N° MASSAR est obligatoire pour l'identification officielle.");
      setActiveTab('identification');
      return;
    }

    if (!lastName.trim() || !firstName.trim()) {
      setError('Veuillez renseigner le nom et le prénom en français.');
      setActiveTab('identification');
      return;
    }

    if (!lastNameArabic.trim() || !firstNameArabic.trim()) {
      setError('Veuillez renseigner le nom et le prénom en arabe.');
      setActiveTab('identification');
      return;
    }

    if (schoolLevel === 'Autre' && !schoolLevelOther.trim()) {
      setError('Veuillez préciser le niveau scolaire.');
      setActiveTab('scolaire');
      return;
    }

    setIsSubmitting(true);

    const studentData: Student = {
      id,
      registrationNumber: registrationNumber.trim().toUpperCase(),
      massarNumber: massarNumber.trim().toUpperCase(),
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      lastNameArabic: lastNameArabic.trim(),
      firstNameArabic: firstNameArabic.trim(),
      photoUrl: photoUrl.trim() || undefined,
      birthDate,
      birthPlace: birthPlace.trim() || undefined,
      gender,
      cin: cin.trim().toUpperCase() || undefined,
      phone: phone.trim(),
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      schoolLevel,
      schoolLevelOther: schoolLevel === 'Autre' ? schoolLevelOther.trim() : undefined,
      registrationDate,
      trainingYear: trainingYear.trim(),
      training: training.trim(),
      group: group.trim(),
      trainer: trainer.trim(),
      room: room.trim() || undefined,
      status,
      guardianName: guardianName.trim() || undefined,
      guardianRelation: guardianRelation.trim() || undefined,
      guardianPhone: guardianPhone.trim() || undefined,
      guardianPhoneSecondary: guardianPhoneSecondary.trim() || undefined,
      guardianAddress: guardianAddress.trim() || undefined,
      createdAt: studentToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await StudentService.saveStudent(studentData);

    if (!res.success) {
      setError(res.error || 'Erreur lors de la sauvegarde.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onSaved(studentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isEditing ? `Modifier l'élève : ${studentToEdit?.firstName} ${studentToEdit?.lastName}` : 'Nouveau Bénéficiaire / Élève'}
              </h2>
              <p className="text-xs text-slate-300">
                Centre Deuxième Chance — Fiche administrative et pédagogique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 pt-3 flex gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('identification')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'identification'
                ? 'bg-white text-blue-900 border-slate-200 border-b-transparent shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Identification</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scolaire')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'scolaire'
                ? 'bg-white text-blue-900 border-slate-200 border-b-transparent shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>2. Niveau Scolaire</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inscription')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'inscription'
                ? 'bg-white text-blue-900 border-slate-200 border-b-transparent shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3. Inscription & Groupe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('responsable')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-t border-x ${
              activeTab === 'responsable'
                ? 'bg-white text-blue-900 border-slate-200 border-b-transparent shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>4. Responsable / Parent</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* TAB 1: IDENTIFICATION */}
          {activeTab === 'identification' && (
            <div className="space-y-4">
              {/* Photo & Unique Identifiers */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                {/* Photo Preview & Upload */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-28 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center relative group">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <label className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                    <Camera className="w-3 h-3 text-blue-600" />
                    <span>Choisir photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Registration & MASSAR numbers */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold uppercase text-[10px] text-slate-600">
                        N° d'inscription (Unique) *
                      </label>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={handleRegenerateRegNumber}
                          className="text-[10px] text-blue-700 font-semibold hover:underline flex items-center gap-0.5"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Générer</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="C2C-2026-001"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Identifiant unique généré automatiquement</span>
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                      N° MASSAR (Unique) *
                    </label>
                    <input
                      type="text"
                      required
                      value={massarNumber}
                      onChange={(e) => setMassarNumber(e.target.value)}
                      placeholder="Ex: M130092817"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-blue-900 text-xs focus:ring-2 focus:ring-blue-600 uppercase"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Numéro national de l'élève</span>
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                      CIN (si disponible)
                    </label>
                    <input
                      type="text"
                      value={cin}
                      onChange={(e) => setCin(e.target.value)}
                      placeholder="Ex: BK712984"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                      Sexe *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Names in French & Arabic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                {/* French */}
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Prénom (Français) *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Yasmine"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Nom (Français) *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Benali"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                {/* Arabic RTL */}
                <div>
                  <label className="block font-bold uppercase text-[10px] text-blue-900 mb-1">
                    الاسم الشخصي (Prénom en arabe) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={firstNameArabic}
                    onChange={(e) => setFirstNameArabic(e.target.value)}
                    placeholder="ياسمين"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-900 font-sans focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-blue-900 mb-1">
                    الاسم العائلي (Nom en arabe) *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={lastNameArabic}
                    onChange={(e) => setLastNameArabic(e.target.value)}
                    placeholder="بن علي"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-900 font-sans focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Civil Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Lieu de naissance
                  </label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Ex: Casablanca"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Téléphone élève *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Adresse de résidence
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Numéro, Rue, Quartier..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Casablanca"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NIVEAU SCOLAIRE */}
          {activeTab === 'scolaire' && (
            <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="block font-bold uppercase text-xs text-slate-800 mb-2">
                  Niveau scolaire antérieur (avant entrée au Centre) *
                </label>
                <select
                  value={schoolLevel}
                  onChange={(e) => setSchoolLevel(e.target.value as SchoolLevel)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Primaire">Primaire</option>
                  <option value="1ère année collège">1ère année collège</option>
                  <option value="2ème année collège">2ème année collège</option>
                  <option value="3ème année collège">3ème année collège</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {/* Conditional Field if Autre */}
              {schoolLevel === 'Autre' && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 animate-fadeIn">
                  <label className="block font-bold text-xs text-blue-950">
                    Préciser le niveau scolaire : *
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolLevelOther}
                    onChange={(e) => setSchoolLevelOther(e.target.value)}
                    placeholder="Ex: Certificat d'Études Primaires (CEP), Lycée Tronc Commun, Déscolarisé..."
                    className="w-full p-2.5 bg-white border border-blue-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-blue-700 block">
                    Indiquez le dernier niveau ou diplôme scolaire attesté.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INSCRIPTION & GROUPE */}
          {activeTab === 'inscription' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Date d'inscription *
                  </label>
                  <input
                    type="date"
                    required
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Année de formation *
                  </label>
                  <input
                    type="text"
                    required
                    value={trainingYear}
                    onChange={(e) => setTrainingYear(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Formation suivie au Centre *
                  </label>
                  <select
                    value={training}
                    onChange={(e) => setTraining(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    {AVAILABLE_TRAININGS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Groupe / Section *
                  </label>
                  <select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    {AVAILABLE_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Formateur référent *
                  </label>
                  <select
                    value={trainer}
                    onChange={(e) => setTrainer(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    {AVAILABLE_TRAINERS.map((tr) => (
                      <option key={tr} value={tr}>{tr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Salle / Atelier habituel
                  </label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    {AVAILABLE_ROOMS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Statut de l'élève *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StudentStatus)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold border ${
                      status === 'Actif'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : status === 'Suspendu'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : status === 'Abandonné'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Abandonné">Abandonné</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RESPONSABLE / PARENT */}
          {activeTab === 'responsable' && (
            <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h3 className="font-bold text-xs uppercase text-slate-700">
                Coordonnées du Responsable Légal / Parent
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Nom et prénom du responsable
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Ex: Omar Benali"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Lien avec l'élève
                  </label>
                  <select
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="Père">Père</option>
                    <option value="Mère">Mère</option>
                    <option value="Tuteur légal">Tuteur légal</option>
                    <option value="Frère / Sœur">Frère / Sœur</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Téléphone principal du responsable
                  </label>
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="06 61 22 33 44"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Téléphone secondaire (urgence)
                  </label>
                  <input
                    type="tel"
                    value={guardianPhoneSecondary}
                    onChange={(e) => setGuardianPhoneSecondary(e.target.value)}
                    placeholder="05 22 45 67 89"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-[10px] text-slate-600 mb-1">
                    Adresse du responsable
                  </label>
                  <input
                    type="text"
                    value={guardianAddress}
                    onChange={(e) => setGuardianAddress(e.target.value)}
                    placeholder="Laisser vide si identique à l'élève"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Form Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs"
            >
              Annuler
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 active:bg-blue-950 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center gap-2 shadow-xs disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Enregistrer le dossier'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
