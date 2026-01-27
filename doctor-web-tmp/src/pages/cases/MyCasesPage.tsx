import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Search,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Select,
  Spinner,
} from '@/components/ui';
import type { Case } from '@/types';
import { getSLAColor, getPriorityColor, formatRelativeTime } from '@/lib/utils';

const MyCasesPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('InReview');

  useEffect(() => {
    loadMyCases();
  }, [statusFilter]);

  const loadMyCases = async () => {
    try {
      setIsLoading(true);
      // Mock data for cases assigned to the current doctor
      const mockCases: Case[] = [
        {
          id: '10',
          caseNumber: 'CS-2026-001220',
          patientName: 'Amaka Chukwu',
          patientAge: 29,
          patientGender: 'Female',
          patientPhone: '+234 800 111 2222',
          status: 'InReview',
          priority: 'High',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          doctorId: 'current-doctor-id',
          doctorName: 'Dr. Smith',
          symptoms: 'Severe abdominal pain, nausea, vomiting',
          createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          assignedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        },
        {
          id: '11',
          caseNumber: 'CS-2026-001215',
          patientName: 'Peter Ojo',
          patientAge: 41,
          patientGender: 'Male',
          patientPhone: '+234 800 333 4444',
          status: 'InReview',
          priority: 'Medium',
          pmvId: 'pmv-2',
          pmvName: 'HealthPlus Pharmacy',
          doctorId: 'current-doctor-id',
          doctorName: 'Dr. Smith',
          symptoms: 'Recurring headaches, fatigue, difficulty sleeping',
          createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          assignedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
      ];

      setCases(mockCases.filter(c => 
        statusFilter === 'all' || c.status === statusFilter
      ));
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
        <p className="text-gray-600 mt-1">
          Cases you're currently reviewing or have claimed
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search cases..."
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: 'InReview', label: 'In Review' },
                  { value: 'all', label: 'All My Cases' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No cases in review</h3>
            <p className="text-gray-600 mt-1 mb-4">
              You haven't claimed any cases yet.
            </p>
            <Link to="/cases">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Pending Cases
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cases.map((caseData) => (
            <Card key={caseData.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {caseData.patientName}
                      </h3>
                      <Badge className={getPriorityColor(caseData.priority)}>
                        {caseData.priority}
                      </Badge>
                      <Badge variant="info">In Review</Badge>
                    </div>
                    <p className="text-gray-700">{caseData.symptoms}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{caseData.caseNumber}</span>
                      <span>•</span>
                      <span>{caseData.pmvName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Claimed {formatRelativeTime(caseData.assignedAt || caseData.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Link to={`/cases/${caseData.id}`}>
                    <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Continue Review
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCasesPage;
