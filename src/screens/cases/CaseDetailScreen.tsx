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
        advice: advice.trim(),
        medications: medications.map(m => ({
          ...m,
          ...classifyDrug(m.name!)
        })) as Medication[],
        followUpRequired: false,
        referralRequired: false,
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

  const priorityColors = getPriorityColor(caseData.priority);
  const slaStatus = getSLAStatus(caseData.createdAt);
  const slaColors = getSLAColor(slaStatus);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.caseNumber}>{caseData.caseNumber}</Text>
            <Text style={styles.patientName}>{caseData.patientName}</Text>
            <Text style={styles.patientDetails}>
              {caseData.patientAge}y • {caseData.patientGender}
            </Text>
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
          <View style={styles.metaItem}>
            <Ionicons name="storefront-outline" size={16} color={colors.primary[100]} />
            <Text style={styles.metaText}>{caseData.pmvBusinessName || caseData.pmvName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.primary[100]} />
            <Text style={styles.metaText}>{formatDateTime(caseData.createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Symptoms */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="medical-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Symptoms</Text>
            </View>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.symptomsText}>{caseData.symptoms}</Text>
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
        </CardContent>
      </Card>

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
      {caseData.pmvNotes && (
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

      {/* Diagnosis Form */}
      <Card style={styles.section}>
        <CardHeader>
          <CardTitle>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="create-outline" size={18} color={colors.primary[600]} />
              <Text style={styles.sectionTitle}>Your Diagnosis</Text>
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
                  <TextInput
                    style={styles.input}
                    placeholder="Drug name"
                    value={med.name}
                    onChangeText={(v) => updateMedication(index, 'name', v)}
                  />
                  {classification && (
                    <Badge
                      variant={classification.isOTC ? 'success' : 'warning'}
                      style={styles.drugBadge}
                    >
                      {classification.type}
                    </Badge>
                  )}
                  <View style={styles.medicationRow}>
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Dosage"
                      value={med.dosage}
                      onChangeText={(v) => updateMedication(index, 'dosage', v)}
                    />
                    <TextInput
                      style={[styles.input, styles.halfInput]}
                      placeholder="Frequency"
                      value={med.frequency}
                      onChangeText={(v) => updateMedication(index, 'frequency', v)}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Duration (e.g., 7 days)"
                    value={med.duration}
                    onChangeText={(v) => updateMedication(index, 'duration', v)}
                  />
                </View>
              );
            })}
          </View>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <Button
          title="Submit Diagnosis"
          onPress={handleSubmit}
          isLoading={isSubmitting}
          fullWidth
          size="lg"
          leftIcon={<Ionicons name="send-outline" size={20} color={colors.white} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
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
  },
  headerBadges: {
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
    marginBottom: spacing.sm,
  },
  halfInput: {
    flex: 1,
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
});
