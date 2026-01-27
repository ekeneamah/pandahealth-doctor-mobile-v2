import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Heart,
  Thermometer,
  Activity,
  FileText,
  Pill,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Send,
  Save,
  Shield,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Badge,
  Button,
  Input,
  Textarea,
  Select,
  Spinner,
  Modal,
  ModalFooter,
} from '@/components/ui';
import ChatPanel from '@/components/chat/ChatPanel';
import type { Case, Medication, PatientVitals } from '@/types';
import { classifyDrug, OTC_DRUGS, CONTROLLED_DRUGS } from '@/types';
import {
  getSLAColor,
  getPriorityColor,
  formatDateTime,
  formatDuration,
  getDrugTypeColor,
  cn,
} from '@/lib/utils';
import toast from 'react-hot-toast';

const medicationSchema = z.object({
  name: z.string().min(1, 'Drug name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  quantity: z.number().optional(),
  instructions: z.string().optional(),
});

const diagnosisSchema = z.object({
  diagnosis: z.string().min(10, 'Please provide a detailed diagnosis'),
  advice: z.string().min(10, 'Please provide advice for the patient'),
  medications: z.array(medicationSchema),
  prescriptionInstructions: z.string().optional(),
  followUpRequired: z.boolean(),
  followUpDate: z.string().optional(),
  referralRequired: z.boolean(),
  referralNotes: z.string().optional(),
});

type DiagnosisFormData = z.infer<typeof diagnosisSchema>;

const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [drugClassifications, setDrugClassifications] = useState<Record<number, ReturnType<typeof classifyDrug>>>({});

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<DiagnosisFormData>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      diagnosis: '',
      advice: '',
      medications: [],
      prescriptionInstructions: '',
      followUpRequired: false,
      followUpDate: '',
      referralRequired: false,
      referralNotes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications',
  });

  const watchMedications = watch('medications');
  const watchFollowUpRequired = watch('followUpRequired');
  const watchReferralRequired = watch('referralRequired');

  useEffect(() => {
    loadCaseDetails();
  }, [id]);

  // Auto-classify drugs when medications change
  useEffect(() => {
    const newClassifications: Record<number, ReturnType<typeof classifyDrug>> = {};
    watchMedications.forEach((med, index) => {
      if (med.name) {
        newClassifications[index] = classifyDrug(med.name);
      }
    });
    setDrugClassifications(newClassifications);
  }, [watchMedications]);

  const loadCaseDetails = async () => {
    try {
      setIsLoading(true);
      // In production, this would be an API call
      // const response = await caseService.getById(id!);

      // Mock data
      const mockCase: Case = {
        id: id!,
        caseNumber: 'CS-2026-001234',
        patientName: 'John Doe',
        patientAge: 35,
        patientGender: 'Male',
        patientPhone: '+234 800 123 4567',
        patientEmail: 'john.doe@email.com',
        status: 'AwaitingDoctor',
        priority: 'High',
        pmvId: 'pmv-1',
        pmvName: 'Adewale Johnson',
        pmvBusinessName: 'Adewale Pharmacy & Clinic',
        symptoms: 'Severe headache, fever, body aches lasting 3 days',
        symptomsDetails: [
          'Headache started 3 days ago, getting worse',
          'Fever measured at 38.5°C at PMV',
          'Body aches especially in joints',
          'Mild sore throat',
          'Loss of appetite',
        ],
        vitals: {
          bloodPressure: '120/80',
          heartRate: 88,
          temperature: 38.5,
          respiratoryRate: 18,
          oxygenSaturation: 98,
          weight: 75,
          height: 175,
          notes: 'Patient appears fatigued but alert',
        },
        pmvNotes:
          'Patient came in complaining of persistent fever and headache. Has been taking Paracetamol with minimal relief. No known allergies. Requested doctor consultation for proper diagnosis and treatment.',
        createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCaseData(mockCase);
    } catch (error) {
      console.error('Failed to load case:', error);
      toast.error('Failed to load case details');
    } finally {
      setIsLoading(false);
    }
  };

  const addMedication = () => {
    append({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: undefined,
      instructions: '',
    });
  };

  const getOTCMedications = () => {
    return watchMedications.filter((_, index) => drugClassifications[index]?.isOTC);
  };

  const getPrescriptionMedications = () => {
    return watchMedications.filter((_, index) => !drugClassifications[index]?.isOTC);
  };

  const getControlledMedications = () => {
    return watchMedications.filter((_, index) => drugClassifications[index]?.controlledSubstance);
  };

  const onSubmit = async (data: DiagnosisFormData) => {
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    const data = watch();
    setIsSubmitting(true);
    try {
      // In production, this would be an API call
      // await caseService.submitDiagnosis({ caseId: id!, ...data });

      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Diagnosis submitted successfully!');
      navigate('/cases');
    } catch (error) {
      toast.error('Failed to submit diagnosis');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const calculateWaitTime = () => {
    if (!caseData) return 0;
    return Math.round(
      (new Date().getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60)
    );
  };

  const getSLAStatus = () => {
    const waitTime = calculateWaitTime();
    if (waitTime <= 21) return 'OnTrack';
    if (waitTime <= 30) return 'AtRisk';
    return 'Breached';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Case not found</h3>
        <p className="text-gray-600 mt-1">The requested case could not be found.</p>
        <Link to="/cases" className="mt-4 inline-block">
          <Button>Back to Cases</Button>
        </Link>
      </div>
    );
  }

  const slaStatus = getSLAStatus();
  const waitTime = calculateWaitTime();

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/cases">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Cases
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{caseData.patientName}</h1>
              <Badge className={getPriorityColor(caseData.priority)}>{caseData.priority}</Badge>
              <Badge className={getSLAColor(slaStatus)}>
                {slaStatus === 'OnTrack' ? 'On Track' : slaStatus === 'AtRisk' ? 'At Risk' : 'SLA Breached'}
              </Badge>
            </div>
            <p className="text-gray-600">{caseData.caseNumber}</p>
          </div>
        </div>
        <div className={cn('text-center px-6 py-3 rounded-lg', getSLAColor(slaStatus))}>
          <p className="text-2xl font-bold">{formatDuration(waitTime)}</p>
          <p className="text-xs">Wait Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Case Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label="Name" value={caseData.patientName} />
              <InfoRow
                icon={Calendar}
                label="Age/Gender"
                value={`${caseData.patientAge} yrs, ${caseData.patientGender}`}
              />
              <InfoRow icon={Phone} label="Phone" value={caseData.patientPhone} />
              {caseData.patientEmail && (
                <InfoRow icon={FileText} label="Email" value={caseData.patientEmail} />
              )}
            </CardContent>
          </Card>

          {/* Vitals */}
          {caseData.vitals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-600" />
                  Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VitalsDisplay vitals={caseData.vitals} />
              </CardContent>
            </Card>
          )}

          {/* PMV Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                PMV Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label="PMV Name" value={caseData.pmvName} />
              {caseData.pmvBusinessName && (
                <InfoRow icon={MapPin} label="Business" value={caseData.pmvBusinessName} />
              )}
              <InfoRow
                icon={Clock}
                label="Submitted"
                value={formatDateTime(caseData.createdAt)}
              />
            </CardContent>
          </Card>

          {/* Chat with PMV */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  Chat with PMV
                </div>
                <Button
                  variant={showChat ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                >
                  {showChat ? 'Hide Chat' : 'Open Chat'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showChat && (
              <CardContent className="p-0">
                <ChatPanel
                  caseId={caseData.id}
                  caseNumber={caseData.caseNumber}
                />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column - Symptoms & Diagnosis Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Symptoms & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Symptoms & Clerking Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Chief Complaint</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{caseData.symptoms}</p>
              </div>

              {caseData.symptomsDetails && caseData.symptomsDetails.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Detailed Symptoms</h4>
                  <ul className="space-y-2">
                    {caseData.symptomsDetails.map((symptom, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700">
                        <span className="w-1.5 h-1.5 bg-primary-600 rounded-full mt-2" />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {caseData.pmvNotes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">PMV Notes</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    {caseData.pmvNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnosis Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-primary-600" />
                  Diagnosis & Prescription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Diagnosis */}
                <Textarea
                  label="Diagnosis"
                  placeholder="Enter your diagnosis based on the patient's symptoms and vitals..."
                  rows={4}
                  error={errors.diagnosis?.message}
                  {...register('diagnosis')}
                />

                {/* Advice */}
                <Textarea
                  label="Medical Advice"
                  placeholder="Enter advice for the patient (lifestyle changes, precautions, etc.)..."
                  rows={3}
                  error={errors.advice?.message}
                  {...register('advice')}
                />

                {/* Medications */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Medications
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMedication}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add Medication
                    </Button>
                  </div>

                  {fields.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Pill className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No medications added yet</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addMedication}
                        className="mt-2"
                      >
                        Add first medication
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => {
                        const classification = drugClassifications[index];
                        return (
                          <div
                            key={field.id}
                            className={cn(
                              'p-4 rounded-lg border-2',
                              classification?.controlledSubstance
                                ? 'bg-red-50 border-red-200'
                                : classification?.isOTC
                                ? 'bg-green-50 border-green-200'
                                : 'bg-blue-50 border-blue-200'
                            )}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {classification && (
                                  <Badge className={getDrugTypeColor(classification.type)}>
                                    {classification.isOTC ? (
                                      <><ShoppingBag className="w-3 h-3 mr-1" /> OTC</>
                                    ) : classification.controlledSubstance ? (
                                      <><Shield className="w-3 h-3 mr-1" /> Controlled</>
                                    ) : (
                                      <><FileText className="w-3 h-3 mr-1" /> Rx Only</>
                                    )}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Input
                                label="Drug Name"
                                placeholder="e.g., Paracetamol, Amoxicillin"
                                error={errors.medications?.[index]?.name?.message}
                                {...register(`medications.${index}.name`)}
                              />
                              <Input
                                label="Dosage"
                                placeholder="e.g., 500mg, 250mg"
                                error={errors.medications?.[index]?.dosage?.message}
                                {...register(`medications.${index}.dosage`)}
                              />
                              <Input
                                label="Frequency"
                                placeholder="e.g., 3 times daily"
                                error={errors.medications?.[index]?.frequency?.message}
                                {...register(`medications.${index}.frequency`)}
                              />
                              <Input
                                label="Duration"
                                placeholder="e.g., 7 days"
                                error={errors.medications?.[index]?.duration?.message}
                                {...register(`medications.${index}.duration`)}
                              />
                            </div>

                            <div className="mt-3">
                              <Input
                                label="Special Instructions (optional)"
                                placeholder="e.g., Take after meals, Avoid alcohol"
                                {...register(`medications.${index}.instructions`)}
                              />
                            </div>

                            {classification?.controlledSubstance && (
                              <div className="mt-3 p-2 bg-red-100 rounded flex items-center gap-2 text-sm text-red-700">
                                <AlertTriangle className="w-4 h-4" />
                                This is a controlled substance - ensure proper documentation
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Drug Summary */}
                  {fields.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {getOTCMedications().length}
                        </p>
                        <p className="text-xs text-gray-600">OTC Drugs</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {getPrescriptionMedications().length - getControlledMedications().length}
                        </p>
                        <p className="text-xs text-gray-600">Prescription Only</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {getControlledMedications().length}
                        </p>
                        <p className="text-xs text-gray-600">Controlled</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prescription Instructions */}
                <Textarea
                  label="General Prescription Instructions (Optional)"
                  placeholder="Any additional instructions for the prescription..."
                  rows={2}
                  {...register('prescriptionInstructions')}
                />

                {/* Follow-up */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      {...register('followUpRequired')}
                    />
                    <span className="text-sm font-medium text-gray-700">Follow-up Required</span>
                  </label>
                </div>

                {watchFollowUpRequired && (
                  <Input
                    type="date"
                    label="Follow-up Date"
                    {...register('followUpDate')}
                  />
                )}

                {/* Referral */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      {...register('referralRequired')}
                    />
                    <span className="text-sm font-medium text-gray-700">Referral Required</span>
                  </label>
                </div>

                {watchReferralRequired && (
                  <Textarea
                    label="Referral Notes"
                    placeholder="Specify specialist type and reason for referral..."
                    rows={2}
                    {...register('referralNotes')}
                  />
                )}
              </CardContent>

              <CardFooter className="flex justify-end gap-3">
                <Button type="button" variant="outline" leftIcon={<Save className="w-4 h-4" />}>
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Submit Diagnosis
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Submission"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to submit this diagnosis? This action will:
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Complete the case review
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Send diagnosis to the PMV
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Generate prescription with {watchMedications.length} medication(s)
            </li>
          </ul>

          {getControlledMedications().length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Controlled Substances</p>
                <p className="text-sm text-red-700">
                  This prescription includes {getControlledMedications().length} controlled
                  substance(s). Ensure proper documentation is maintained.
                </p>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmSubmit} isLoading={isSubmitting}>
            Confirm & Submit
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

// Helper Components
interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <Icon className="w-4 h-4 text-gray-400" />
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  </div>
);

interface VitalsDisplayProps {
  vitals: PatientVitals;
}

const VitalsDisplay: React.FC<VitalsDisplayProps> = ({ vitals }) => (
  <div className="grid grid-cols-2 gap-4">
    {vitals.bloodPressure && (
      <VitalItem
        icon={Heart}
        label="Blood Pressure"
        value={vitals.bloodPressure}
        unit="mmHg"
        color="red"
      />
    )}
    {vitals.heartRate && (
      <VitalItem
        icon={Activity}
        label="Heart Rate"
        value={vitals.heartRate.toString()}
        unit="bpm"
        color="pink"
      />
    )}
    {vitals.temperature && (
      <VitalItem
        icon={Thermometer}
        label="Temperature"
        value={vitals.temperature.toString()}
        unit="°C"
        color={vitals.temperature > 37.5 ? 'orange' : 'blue'}
      />
    )}
    {vitals.oxygenSaturation && (
      <VitalItem
        icon={Activity}
        label="SpO2"
        value={vitals.oxygenSaturation.toString()}
        unit="%"
        color="green"
      />
    )}
    {vitals.respiratoryRate && (
      <VitalItem
        icon={Activity}
        label="Resp. Rate"
        value={vitals.respiratoryRate.toString()}
        unit="/min"
        color="purple"
      />
    )}
    {vitals.weight && (
      <VitalItem
        icon={User}
        label="Weight"
        value={vitals.weight.toString()}
        unit="kg"
        color="gray"
      />
    )}
  </div>
);

interface VitalItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
}

const VitalItem: React.FC<VitalItemProps> = ({ icon: Icon, label, value, unit, color }) => {
  const colors: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    pink: 'bg-pink-50 text-pink-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className={cn('p-3 rounded-lg', colors[color])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">
        {value} <span className="text-xs font-normal">{unit}</span>
      </p>
    </div>
  );
};

export default CaseDetailPage;
