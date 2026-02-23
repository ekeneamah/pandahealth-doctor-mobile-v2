import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@/src/components/ui';
import { borderRadius, colors, fontSize, spacing } from '@/src/constants/theme';
import { getErrorMessage } from '@/src/lib/api-client';
import { formatDateTime, getPriorityColor, getSLAColor } from '@/src/lib/utils';
import { caseService } from '@/src/services/case.service';
import type { Case, Medication } from '@/src/types';
import { classifyDrug, getSLAStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface VitalItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number | undefined;
  unit?: string;
}

const VitalItem: React.FC<VitalItemProps> = ({ icon, label, value, unit }) => {
  if (!value) return null;
  return (
    <View style={styles.vitalItem}>
      <Ionicons name={icon} size={18} color={colors.primary[600]} />
      <View style={styles.vitalInfo}>
        <Text style={styles.vitalLabel}>{label}</Text>
        <Text style={styles.vitalValue}>
          {value}{unit && <Text style={styles.vitalUnit}> {unit}</Text>}
        </Text>
      </View>
    </View>
  );
};

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [medications, setMedications] = useState<Partial<Medication>[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const loadCaseDetails = useCallback(async () => {
    try {
      console.log('[CaseDetailScreen] Loading case:', id);
      const response = await caseService.getById(id!);
      
      if (response.success && response.data) {
        console.log('[CaseDetailScreen] Case loaded:', response.data.caseNumber);
        setCaseData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load case details');
        router.back();
      }
    } catch (error) {
      console.error('[CaseDetailScreen] Error loading case:', error);
      Alert.alert('Error', getErrorMessage(error));
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCaseDetails();
  }, [loadCaseDetails]);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) {
      Alert.alert('Error', 'Please provide a diagnosis');
      return;
    }
    if (!advice.trim()) {
      Alert.alert('Error', 'Please provide advice for the patient');
      return;
    }
    if (medications.length === 0) {
      Alert.alert('Error', 'Please add at least one medication');
      return;
    }

    // Validate all medications are complete
    const incompleteMeds = medications.filter(
      m => !m.name?.trim() || !m.dosage?.trim() || !m.frequency?.trim() || !m.duration?.trim()
    );
    if (incompleteMeds.length > 0) {
      Alert.alert('Error', 'Please complete all medication fields');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[CaseDetailScreen] Submitting diagnosis for case:', id);
      
      const response = await caseService.submitDiagnosis(id!, {
        caseId: id!,
        diagnosis: diagnosis.trim(),
        doctorAdvice: advice.trim(),
        prescriptions: medications.map(m => ({
          drugName: m.name!,
          dosage: m.dosage!,
          frequency: m.frequency!,
          durationDays: parseInt(m.duration!.match(/\d+/)?.[0] || '7'),
          instructions: undefined,
        })),
      });

      if (response.success) {
        Alert.alert('Success', 'Diagnosis submitted successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to submit diagnosis');
      }
    } catch (error) {
      console.error('[CaseDetailScreen] Error submitting diagnosis:', error);
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimCase = async () => {
    Alert.alert(
      'Claim Case',
      'Are you sure you want to claim this case?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            setIsClaiming(true);
            try {
              console.log('[CaseDetailScreen] Claiming case:', id);
              const response = await caseService.claimCase(id!);

              if (response.success && response.data) {
                setCaseData(response.data);
                Alert.alert('Success', 'Case claimed successfully. You can now review and diagnose this case.');
              } else {
                Alert.alert('Error', response.message || 'Failed to claim case');
              }
            } catch (error) {
              console.error('[CaseDetailScreen] Error claiming case:', error);
              Alert.alert('Error', getErrorMessage(error));
            } finally {
              setIsClaiming(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="lg" />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Case not found</Text>
      </View>
    );
  }

  const isPendingCase = caseData.status === 'Pending';
  const priorityColors = getPriorityColor(caseData.priority);
  const slaStatus = getSLAStatus(caseData.createdAt);
  const slaColors = getSLAColor(slaStatus);

  // Check if diagnosis can still be edited (within 30 minutes)
  const canEditDiagnosis = () => {
    if (!caseData.diagnosis || !caseData.diagnosisSubmittedAt) return false;
    const submittedAt = new Date(caseData.diagnosisSubmittedAt);
    const now = new Date();
    const minutesSince = (now.getTime() - submittedAt.getTime()) / (1000 * 60);
    return minutesSince <= 30;
  };

  const getEditWindowRemaining = () => {
    if (!caseData.diagnosisSubmittedAt) return 0;
    const submittedAt = new Date(caseData.diagnosisSubmittedAt);
    const now = new Date();
    const minutesSince = (now.getTime() - submittedAt.getTime()) / (1000 * 60);
    return Math.max(0, Math.ceil(30 - minutesSince));
  };

  const handleEditDiagnosis = () => {
    setIsEditMode(true);
    setDiagnosis(caseData?.diagnosis || '');
    setAdvice(caseData?.doctorAdvice || '');
    // Map existing prescriptions back to medication format
    if (caseData?.prescriptions) {
      setMedications(caseData.prescriptions.map(p => ({
        name: p.drugName,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: `${p.durationDays} days`,
      })));
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setDiagnosis('');
    setAdvice('');
    setMedications([]);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.caseNumber}>{caseData.caseNumber}</Text>
            <Text style={styles.patientName}>
              {caseData.patientName || `Patient (${caseData.patientGender}, ${caseData.patientAgeRange || caseData.patientAge})`}
            </Text>
            <Text style={styles.patientDetails}>
              {caseData.patientAgeRange || `${caseData.patientAge}y`} • {caseData.patientGender}
              {caseData.patientPhone && ` • ${caseData.patientPhone}`}
            </Text>
            {caseData.type && (
              <Text style={styles.caseType}>Type: {caseData.type}</Text>
            )}
          </View>
          <View style={styles.headerBadges}>
            <Badge backgroundColor={priorityColors.bg} textColor={priorityColors.text}>
              {caseData.priority}
            </Badge>
            <Badge backgroundColor={slaColors.bg} textColor={slaColors.text}>
              {slaStatus}
            </Badge>
          </View>
        </View>
        <View style={styles.headerMeta}>
          <TouchableOpacity 
            style={styles.metaItem}
            onPress={() => caseData.pmvId && router.push({ pathname: '/pmv/[id]', params: { id: caseData.pmvId } })}
            activeOpacity={0.7}
          >
            <Ionicons name="storefront-outline" size={16} color={colors.primary[100]} />
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <Text style={[styles.metaText, styles.metaTextClickable]} numberOfLines={1}>
                {caseData.pmvBusinessName || 'Unknown Business'}
              </Text>
              {caseData.pmvName && caseData.pmvBusinessName && (
                <Text style={[styles.metaText, styles.pmvOwnerName]} numberOfLines={1}>
                  {caseData.pmvName}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.primary[100]} />
          </TouchableOpacity>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.primary[100]} />
            <Text style={styles.metaText}>{formatDateTime(caseData.createdAt)}</Text>
          </View>
        </View>
        
        {/* Chat Button - Always visible */}
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => router.push(`/case/${id}/chat`)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.chatButtonText}>Chat with PMV</Text>
        </TouchableOpacity>
      </View>

      {/* Symptoms */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="medical-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Chief Complaint & Symptoms</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {caseData.chiefComplaint && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Chief Complaint:</Text>
              <Text style={styles.detailText}>{caseData.chiefComplaint}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Symptoms:</Text>
            <Text style={styles.symptomsText}>{caseData.symptoms}</Text>
          </View>
          {caseData.symptomsDetails && caseData.symptomsDetails.length > 0 && (
            <View style={styles.symptomsList}>
              {caseData.symptomsDetails.map((detail, index) => (
                <View key={index} style={styles.symptomItem}>
                  <View style={styles.symptomBullet} />
                  <Text style={styles.symptomText}>{detail}</Text>
                </View>
              ))}
            </View>
          )}
          {caseData.notes && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Additional Notes:</Text>
              <Text style={styles.detailText}>{caseData.notes}</Text>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Medical History */}
      {(caseData.pastMedicalHistory || caseData.drugHistory || caseData.allergies || caseData.systemicReview) && (
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="clipboard-outline" size={18} color={colors.primary[600]} />
                <Text style={styles.sectionTitle}>Medical History</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {caseData.pastMedicalHistory && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Past Medical History:</Text>
                <Text style={styles.detailText}>{caseData.pastMedicalHistory}</Text>
              </View>
            )}
            {caseData.drugHistory && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Drug History:</Text>
                <Text style={styles.detailText}>{caseData.drugHistory}</Text>
              </View>
            )}
            {caseData.allergies && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Allergies:</Text>
                <Text style={styles.detailText}>{caseData.allergies}</Text>
              </View>
            )}
            {caseData.systemicReview && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Systemic Review:</Text>
                <Text style={styles.detailText}>{caseData.systemicReview}</Text>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vitals */}
      {caseData.vitals && (
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="pulse-outline" size={18} color={colors.primary[600]} />
                <Text style={styles.sectionTitle}>Vital Signs</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.vitalsGrid}>
              <VitalItem icon="heart-outline" label="Blood Pressure" value={caseData.vitals.bloodPressure} unit="mmHg" />
              <VitalItem icon="pulse-outline" label="Heart Rate" value={caseData.vitals.heartRate} unit="bpm" />
              <VitalItem icon="thermometer-outline" label="Temperature" value={caseData.vitals.temperature} unit="°C" />
              <VitalItem icon="fitness-outline" label="SpO2" value={caseData.vitals.oxygenSaturation} unit="%" />
            </View>
            {caseData.vitals.notes && (
              <Text style={styles.vitalsNotes}>Note: {caseData.vitals.notes}</Text>
            )}
          </CardContent>
        </Card>
      )}

      {/* PMV Notes */}
      {caseData.pmvNotes && !isPendingCase && (
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary[600]} />
                <Text style={styles.sectionTitle}>PMV Notes</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.pmvNotes}>{caseData.pmvNotes}</Text>
          </CardContent>
        </Card>
      )}

      {/* Submitted Diagnosis Display */}
      {caseData.diagnosis && !isEditMode && (
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="medical" size={18} color={colors.primary[600]} />
                <Text style={styles.sectionTitle}>Diagnosis</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canEditDiagnosis() && (
              <View style={styles.editWarning}>
                <Ionicons name="time-outline" size={16} color={colors.warning[600]} />
                <Text style={styles.editWarningText}>
                  Can edit for {getEditWindowRemaining()} more minutes
                </Text>
                <TouchableOpacity style={styles.editButton} onPress={handleEditDiagnosis}>
                  <Ionicons name="create-outline" size={16} color={colors.primary[600]} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Diagnosis:</Text>
              <Text style={styles.detailText}>{caseData.diagnosis}</Text>
            </View>
            {caseData.doctorAdvice && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Doctor's Advice:</Text>
                <Text style={styles.detailText}>{caseData.doctorAdvice}</Text>
              </View>
            )}
            {caseData.prescriptions && caseData.prescriptions.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Prescribed Medications:</Text>
                {caseData.prescriptions.map((med, index) => (
                  <View key={index} style={styles.prescriptionItem}>
                    <Text style={styles.prescriptionName}>• {med.drugName}</Text>
                    <Text style={styles.prescriptionDetails}>
                      {med.dosage} - {med.frequency} for {med.durationDays} days
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Form */}
      {!isPendingCase && (isEditMode || !caseData.diagnosis) && (
        <Card style={styles.section}>
          <CardHeader>
            <CardTitle>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="create-outline" size={18} color={colors.primary[600]} />
                <Text style={styles.sectionTitle}>{isEditMode ? 'Edit Diagnosis' : 'Your Diagnosis'}</Text>
              </View>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Diagnosis *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter your diagnosis..."
                value={diagnosis}
                onChangeText={setDiagnosis}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Advice / Instructions *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter advice for the patient..."
                value={advice}
                onChangeText={setAdvice}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Medications */}
            <View style={styles.formGroup}>
              <View style={styles.medicationsHeader}>
                <Text style={styles.label}>Medications</Text>
                <TouchableOpacity style={styles.addButton} onPress={addMedication}>
                  <Ionicons name="add" size={20} color={colors.primary[600]} />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {medications.map((med, index) => {
                const classification = med.name ? classifyDrug(med.name) : null;
                return (
                  <View key={index} style={styles.medicationCard}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationIndex}>Drug {index + 1}</Text>
                      <TouchableOpacity onPress={() => removeMedication(index)}>
                        <Ionicons name="trash-outline" size={18} color={colors.error[500]} />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Drug Name */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Drug Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., Paracetamol, Amoxicillin"
                        value={med.name}
                        onChangeText={(v) => updateMedication(index, 'name', v)}
                      />
                    </View>
                    {classification && (
                      <Badge
                        variant={
                          classification.type === 'Controlled' ? 'error' : 
                          classification.isOTC ? 'success' : 'warning'
                        }
                        style={styles.drugBadge}
                      >
                        {classification.type === 'PrescriptionOnly' 
                          ? '💊 Prescription Required' 
                          : classification.type === 'Controlled'
                          ? '⚠️ Controlled Drug'
                          : '✓ Over-the-Counter'}
                      </Badge>
                    )}
                    
                    {/* Dosage and Frequency */}
                    <View style={styles.medicationRow}>
                      <View style={[styles.fieldContainer, styles.halfInput]}>
                        <Text style={styles.fieldLabel}>Dosage *</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., 500mg, 2 tablets"
                          value={med.dosage}
                          onChangeText={(v) => updateMedication(index, 'dosage', v)}
                          keyboardType="visible-password"
                        />
                      </View>
                      <View style={[styles.fieldContainer, styles.halfInput]}>
                        <Text style={styles.fieldLabel}>Frequency *</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g., 3 times daily"
                          value={med.frequency}
                          onChangeText={(v) => updateMedication(index, 'frequency', v)}
                          keyboardType="default"
                        />
                      </View>
                    </View>
                    
                    {/* Duration */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Duration *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., 7 days, 2 weeks"
                        value={med.duration}
                        onChangeText={(v) => updateMedication(index, 'duration', v)}
                        keyboardType="default"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {!isPendingCase && (isEditMode || !caseData.diagnosis) && (
        <View style={styles.submitContainer}>
          {isEditMode && (
            <Button
              title="Cancel"
              onPress={handleCancelEdit}
              variant="outline"
              fullWidth
              size="lg"
              style={styles.cancelButton}
            />
          )}
          <Button
            title={isEditMode ? 'Update Diagnosis' : 'Submit Diagnosis'}
            onPress={handleSubmit}
            isLoading={isSubmitting}
            fullWidth
            size="lg"
            leftIcon={<Ionicons name="send-outline" size={20} color={colors.white} />}
          />
        </View>
      )}
      </ScrollView>

      {/* Claim Case FAB - Only for pending cases */}
      {isPendingCase && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleClaimCase}
          disabled={isClaiming}
          activeOpacity={0.8}
        >
          <Ionicons name="hand-right" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: colors.primary[600],
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caseNumber: {
    fontSize: fontSize.xs,
    color: colors.primary[200],
    marginBottom: spacing.xs,
  },
  patientName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  patientDetails: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
    marginTop: spacing.xs,
  },  caseType: {
    fontSize: fontSize.sm,
    color: colors.primary[200],
    marginTop: spacing.xs / 2,
  },  headerBadges: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primary[500],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
  },
  metaTextClickable: {
    textDecorationLine: 'underline',
  },
  pmvOwnerName: {
    fontSize: 11,
    color: colors.primary[200],
    marginTop: 2,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.primary[600],
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl * 4,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 999,
  },
  section: {
    margin: spacing.lg,
    marginBottom: 0,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  symptomsText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 24,
  },
  detailItem: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.base,
    color: colors.gray[800],
    lineHeight: 22,
  },
  symptomsList: {
    marginTop: spacing.md,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  symptomBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary[600],
    marginTop: 7,
    marginRight: spacing.sm,
  },
  symptomText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  vitalInfo: {
    flex: 1,
  },
  vitalLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  vitalValue: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  vitalUnit: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    color: colors.gray[500],
  },
  vitalsNotes: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  pmvNotes: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: 24,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
    minHeight: 100,
  },
  input: {
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  halfInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  medicationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary[600],
  },
  medicationCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  medicationIndex: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[600],
  },
  medicationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  drugBadge: {
    marginBottom: spacing.sm,
  },
  submitContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  prescriptionItem: {
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  prescriptionName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs / 2,
  },
  prescriptionDetails: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  editWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  editWarningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.warning[700],
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary[600],
  },
  cancelButton: {
    marginBottom: spacing.md,
  },
});
