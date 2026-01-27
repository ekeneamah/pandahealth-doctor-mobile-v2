// ==========================================
// Authentication Types
// ==========================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  specialization?: string;
  licenseNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'Admin' | 'SuperAdmin' | 'PMV' | 'Doctor';

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerprint?: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: string[];
  timestamp: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==========================================
// Case Types
// ==========================================

export interface Case {
  id: string;
  caseNumber: string;
  patientName: string;
  patientAge?: number;
  patientGender?: 'Male' | 'Female' | 'Other';
  patientPhone: string;
  patientEmail?: string;
  status: CaseStatus;
  priority: CasePriority;
  pmvId: string;
  pmvName: string;
  pmvBusinessName?: string;
  doctorId?: string;
  doctorName?: string;
  symptoms: string;
  symptomsDetails?: string[];
  vitals?: PatientVitals;
  pmvNotes?: string;
  diagnosis?: string;
  doctorAdvice?: string;
  prescription?: Prescription;
  responseTime?: number; // in minutes
  slaStatus?: SLAStatus;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  completedAt?: string;
}

export type CaseStatus = 
  | 'Pending'
  | 'AwaitingDoctor'
  | 'InReview'
  | 'Completed'
  | 'Cancelled';

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type SLAStatus = 'OnTrack' | 'AtRisk' | 'Breached';

export interface PatientVitals {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodGlucose?: number;
  notes?: string;
}

export interface Prescription {
  id?: string;
  medications: Medication[];
  instructions?: string;
  followUpDate?: string;
  createdAt?: string;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: number;
  instructions?: string;
  drugType: DrugType;
  isOTC: boolean;
}

export type DrugType = 'OTC' | 'PrescriptionOnly' | 'Controlled';

// ==========================================
// Doctor Response Types
// ==========================================

export interface DoctorResponse {
  caseId: string;
  diagnosis: string;
  advice: string;
  prescription: Prescription;
  followUpRequired: boolean;
  followUpDate?: string;
  referralRequired: boolean;
  referralNotes?: string;
}

export interface SubmitDiagnosisRequest {
  caseId: string;
  diagnosis: string;
  advice: string;
  medications: Medication[];
  prescriptionInstructions?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  referralRequired: boolean;
  referralNotes?: string;
}

// ==========================================
// Dashboard Types
// ==========================================

export interface DoctorDashboardStats {
  pendingCases: number;
  inReviewCases: number;
  completedToday: number;
  completedThisWeek: number;
  averageResponseTime: number; // in minutes
  slaComplianceRate: number; // percentage
  totalCasesHandled: number;
}

export interface SLAMetrics {
  totalCases: number;
  withinSLA: number;
  atRisk: number;
  breached: number;
  averageResponseTime: number;
  targetResponseTime: number;
}

// ==========================================
// Drug Classification Types
// ==========================================

export interface DrugClassification {
  name: string;
  type: DrugType;
  isOTC: boolean;
  requiresPrescription: boolean;
  controlledSubstance: boolean;
  schedule?: string;
  warnings?: string[];
}

// Common OTC drugs list for auto-classification
export const OTC_DRUGS = [
  'Paracetamol',
  'Ibuprofen',
  'Aspirin',
  'Acetaminophen',
  'Antacid',
  'Vitamin C',
  'Vitamin D',
  'Multivitamins',
  'Oral Rehydration Salts',
  'Cough Syrup',
  'Loratadine',
  'Cetirizine',
  'Diphenhydramine',
  'Omeprazole',
  'Famotidine',
  'Loperamide',
  'Hydrocortisone Cream',
  'Calamine Lotion',
  'Saline Nasal Spray',
  'Throat Lozenges',
];

export const CONTROLLED_DRUGS = [
  'Codeine',
  'Tramadol',
  'Diazepam',
  'Alprazolam',
  'Morphine',
  'Oxycodone',
  'Fentanyl',
  'Methylphenidate',
  'Amphetamine',
  'Phenobarbital',
];

// ==========================================
// Helper Functions
// ==========================================

export function classifyDrug(drugName: string): DrugClassification {
  const normalizedName = drugName.toLowerCase().trim();
  
  // Check if controlled
  const isControlled = CONTROLLED_DRUGS.some(drug => 
    normalizedName.includes(drug.toLowerCase())
  );
  
  if (isControlled) {
    return {
      name: drugName,
      type: 'Controlled',
      isOTC: false,
      requiresPrescription: true,
      controlledSubstance: true,
      warnings: ['This is a controlled substance and requires special handling'],
    };
  }
  
  // Check if OTC
  const isOTC = OTC_DRUGS.some(drug => 
    normalizedName.includes(drug.toLowerCase())
  );
  
  if (isOTC) {
    return {
      name: drugName,
      type: 'OTC',
      isOTC: true,
      requiresPrescription: false,
      controlledSubstance: false,
    };
  }
  
  // Default to prescription only
  return {
    name: drugName,
    type: 'PrescriptionOnly',
    isOTC: false,
    requiresPrescription: true,
    controlledSubstance: false,
  };
}

export function getSLAStatus(createdAt: string, targetMinutes: number = 30): SLAStatus {
  const created = new Date(createdAt);
  const now = new Date();
  const elapsedMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
  
  if (elapsedMinutes <= targetMinutes * 0.7) {
    return 'OnTrack';
  } else if (elapsedMinutes <= targetMinutes) {
    return 'AtRisk';
  }
  return 'Breached';
}

export function calculateResponseTime(createdAt: string, completedAt?: string): number {
  const created = new Date(createdAt);
  const completed = completedAt ? new Date(completedAt) : new Date();
  return Math.round((completed.getTime() - created.getTime()) / (1000 * 60));
}

// ==========================================
// Chat Types
// ==========================================

export type MessageType = 'Text' | 'Image' | 'Document' | 'SystemNotification';

export interface ChatMessage {
  id: string;
  caseId: string;
  senderId: string;
  senderName: string;
  senderRole: 'Doctor' | 'PMV';
  message: string;
  messageType: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  isOwnMessage: boolean;
}

export interface ChatThread {
  id: string;
  caseId: string;
  caseNumber: string;
  doctorId: string;
  doctorName: string;
  pmvId: string;
  pmvName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
}

export interface ChatMessagesResponse {
  caseId: string;
  caseNumber: string;
  thread?: ChatThread;
  messages: ChatMessage[];
  hasMore: boolean;
}

export interface SendMessageRequest {
  caseId: string;
  message: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
}

export interface UploadChatFileRequest {
  caseId: string;
  fileName: string;
  contentType: string;
  fileContent: string; // Base64 encoded
  caption?: string;
}

export interface ChatFileUploadResponse {
  fileUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  message?: ChatMessage;
}

export interface UnreadCountResponse {
  totalUnreadCount: number;
  unreadByCaseId: Record<string, number>;
}
