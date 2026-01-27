import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Select,
  Spinner,
} from '@/components/ui';
import type { Case, CasePriority } from '@/types';
import { getSLAColor, getPriorityColor, formatRelativeTime, cn } from '@/lib/utils';

const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadCases();
  }, [page, priorityFilter]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      // In production, this would be an API call
      // const response = await caseService.getPendingCases(page, 10);
      
      // Mock data
      const mockCases: Case[] = [
        {
          id: '1',
          caseNumber: 'CS-2026-001234',
          patientName: 'John Doe',
          patientAge: 35,
          patientGender: 'Male',
          patientPhone: '+234 800 123 4567',
          status: 'AwaitingDoctor',
          priority: 'High',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          pmvBusinessName: 'Adewale Pharmacy & Clinic',
          symptoms: 'Severe headache, fever, body aches lasting 3 days',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          caseNumber: 'CS-2026-001235',
          patientName: 'Sarah Johnson',
          patientAge: 28,
          patientGender: 'Female',
          patientPhone: '+234 800 234 5678',
          status: 'AwaitingDoctor',
          priority: 'Medium',
          pmvId: 'pmv-2',
          pmvName: 'HealthPlus Pharmacy',
          symptoms: 'Persistent cough, sore throat, runny nose for 5 days',
          createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          caseNumber: 'CS-2026-001236',
          patientName: 'Michael Obi',
          patientAge: 45,
          patientGender: 'Male',
          patientPhone: '+234 800 345 6789',
          status: 'AwaitingDoctor',
          priority: 'Urgent',
          pmvId: 'pmv-3',
          pmvName: 'Care Pharmacy',
          symptoms: 'Chest pain, shortness of breath, dizziness',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          caseNumber: 'CS-2026-001237',
          patientName: 'Grace Emeka',
          patientAge: 32,
          patientGender: 'Female',
          patientPhone: '+234 800 456 7890',
          status: 'AwaitingDoctor',
          priority: 'Low',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Mild stomach discomfort, occasional nausea',
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '5',
          caseNumber: 'CS-2026-001238',
          patientName: 'David Akinola',
          patientAge: 52,
          patientGender: 'Male',
          patientPhone: '+234 800 567 8901',
          status: 'AwaitingDoctor',
          priority: 'High',
          pmvId: 'pmv-4',
          pmvName: 'MediCare Pharmacy',
          symptoms: 'High blood pressure symptoms, headache, blurred vision',
          createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Apply filters
      let filtered = mockCases;
      if (priorityFilter !== 'all') {
        filtered = filtered.filter((c) => c.priority === priorityFilter);
      }
      if (searchTerm) {
        filtered = filtered.filter(
          (c) =>
            c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.symptoms.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Sort by priority (Urgent first) and then by creation time
      filtered.sort((a, b) => {
        const priorityOrder: Record<CasePriority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setCases(filtered);
      setTotalPages(Math.ceil(filtered.length / 10) || 1);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadCases();
  };

  const getSLAStatusFromCase = (caseData: Case) => {
    const waitTime = Math.round(
      (new Date().getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60)
    );
    if (waitTime <= 21) return 'OnTrack';
    if (waitTime <= 30) return 'AtRisk';
    return 'Breached';
  };

  const getWaitTime = (createdAt: string) => {
    const waitTime = Math.round(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60)
    );
    if (waitTime < 60) return `${waitTime}m`;
    const hours = Math.floor(waitTime / 60);
    const mins = waitTime % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Cases</h1>
          <p className="text-gray-600 mt-1">
            Review and respond to cases awaiting doctor consultation
          </p>
        </div>
        <Button onClick={handleRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by patient name, case number, or symptoms..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'Urgent', label: 'Urgent' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No pending cases</h3>
            <p className="text-gray-600 mt-1">
              {searchTerm || priorityFilter !== 'all'
                ? 'No cases match your current filters'
                : 'All cases have been reviewed. Check back later for new cases.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cases.map((caseData) => {
            const slaStatus = getSLAStatusFromCase(caseData);
            const waitTime = getWaitTime(caseData.createdAt);

            return (
              <Card
                key={caseData.id}
                className={cn(
                  'hover:shadow-md transition-shadow',
                  slaStatus === 'Breached' && 'border-red-200 bg-red-50/30'
                )}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Case Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {caseData.patientName}
                        </h3>
                        <Badge className={getPriorityColor(caseData.priority)}>
                          {caseData.priority}
                        </Badge>
                        <Badge className={getSLAColor(slaStatus)} size="sm">
                          {slaStatus === 'OnTrack'
                            ? 'On Track'
                            : slaStatus === 'AtRisk'
                            ? 'At Risk'
                            : 'SLA Breached'}
                        </Badge>
                      </div>

                      <p className="text-gray-700">{caseData.symptoms}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {caseData.patientAge} yrs, {caseData.patientGender}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {caseData.pmvName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Waiting: {waitTime}
                        </span>
                        <span className="text-gray-400">{caseData.caseNumber}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'text-center px-4 py-2 rounded-lg',
                          slaStatus === 'OnTrack'
                            ? 'bg-green-50'
                            : slaStatus === 'AtRisk'
                            ? 'bg-yellow-50'
                            : 'bg-red-50'
                        )}
                      >
                        <p
                          className={cn(
                            'text-2xl font-bold',
                            slaStatus === 'OnTrack'
                              ? 'text-green-600'
                              : slaStatus === 'AtRisk'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          )}
                        >
                          {waitTime}
                        </p>
                        <p className="text-xs text-gray-500">wait time</p>
                      </div>
                      <Link to={`/cases/${caseData.id}`}>
                        <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                          Review Case
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {cases.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {cases.length} case{cases.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesPage;
