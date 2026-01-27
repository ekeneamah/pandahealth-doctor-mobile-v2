import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Spinner,
} from '@/components/ui';
import type { Case } from '@/types';
import { formatDate, formatDateTime, formatDuration, getPriorityColor } from '@/lib/utils';

const HistoryPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      // Mock completed cases
      const mockCases: Case[] = [
        {
          id: '100',
          caseNumber: 'CS-2026-001200',
          patientName: 'Chioma Nwankwo',
          patientAge: 34,
          patientGender: 'Female',
          patientPhone: '+234 800 999 8888',
          status: 'Completed',
          priority: 'Medium',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Urinary tract infection symptoms',
          diagnosis: 'Acute cystitis',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
          responseTime: 25,
        },
        {
          id: '101',
          caseNumber: 'CS-2026-001195',
          patientName: 'Oluwaseun Bakare',
          patientAge: 29,
          patientGender: 'Male',
          patientPhone: '+234 800 777 6666',
          status: 'Completed',
          priority: 'High',
          pmvId: 'pmv-2',
          pmvName: 'HealthPlus Pharmacy',
          symptoms: 'Severe migraine with visual disturbances',
          diagnosis: 'Migraine with aura',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
          responseTime: 18,
        },
        {
          id: '102',
          caseNumber: 'CS-2026-001190',
          patientName: 'Aisha Mohammed',
          patientAge: 42,
          patientGender: 'Female',
          patientPhone: '+234 800 555 4444',
          status: 'Completed',
          priority: 'Low',
          pmvId: 'pmv-3',
          pmvName: 'Care Pharmacy',
          symptoms: 'Seasonal allergies, itchy eyes',
          diagnosis: 'Allergic conjunctivitis',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
          responseTime: 15,
        },
        {
          id: '103',
          caseNumber: 'CS-2026-001185',
          patientName: 'Emmanuel Okonkwo',
          patientAge: 55,
          patientGender: 'Male',
          patientPhone: '+234 800 333 2222',
          status: 'Completed',
          priority: 'Urgent',
          pmvId: 'pmv-1',
          pmvName: 'Adewale Pharmacy',
          symptoms: 'Suspected diabetes symptoms',
          diagnosis: 'Type 2 Diabetes Mellitus',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
          responseTime: 12,
        },
      ];

      setCases(mockCases);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case History</h1>
          <p className="text-gray-600 mt-1">View your completed consultations</p>
        </div>
        <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by patient name or case number..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Input type="date" placeholder="From date" className="w-40" />
              <Input type="date" placeholder="To date" className="w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
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
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    <p className="text-gray-700">{caseData.diagnosis}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{caseData.caseNumber}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(caseData.completedAt || caseData.updatedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Response: {formatDuration(caseData.responseTime || 0)}
                      </span>
                    </div>
                  </div>
                  <Link to={`/history/${caseData.id}`}>
                    <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing {cases.length} cases</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
