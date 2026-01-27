import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Activity,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Spinner } from '@/components/ui';
import { useAuthStore } from '@/store/auth.store';
import { caseService } from '@/services/case.service';
import type { Case, DoctorDashboardStats, SLAMetrics } from '@/types';
import { formatRelativeTime, getSLAColor, getPriorityColor, formatDuration } from '@/lib/utils';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics | null>(null);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // In production, these would be actual API calls
      // For now, we'll use mock data
      
      // Simulated stats
      setStats({
        pendingCases: 12,
        inReviewCases: 3,
        completedToday: 8,
        completedThisWeek: 45,
        averageResponseTime: 18,
        slaComplianceRate: 94,
        totalCasesHandled: 520,
      });

      setSlaMetrics({
        totalCases: 50,
        withinSLA: 47,
        atRisk: 2,
        breached: 1,
        averageResponseTime: 18,
        targetResponseTime: 30,
      });

      // Simulated recent pending cases
      setRecentCases([
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
          symptoms: 'Severe headache, fever, body aches',
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
          symptoms: 'Cough, sore throat, runny nose',
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
          symptoms: 'Chest pain, shortness of breath',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Good {getTimeOfDay()}, Dr. {user?.firstName}!
        </h1>
        <p className="text-primary-100 mt-1">
          You have {stats?.pendingCases || 0} cases waiting for your review
        </p>
        <div className="flex gap-4 mt-4">
          <Link to="/cases">
            <Button
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-primary-50"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Pending Cases
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Cases"
          value={stats?.pendingCases || 0}
          icon={ClipboardList}
          color="blue"
          description="Awaiting your review"
        />
        <StatCard
          title="In Review"
          value={stats?.inReviewCases || 0}
          icon={Clock}
          color="yellow"
          description="Currently working on"
        />
        <StatCard
          title="Completed Today"
          value={stats?.completedToday || 0}
          icon={CheckCircle}
          color="green"
          description="Cases completed"
        />
        <StatCard
          title="Avg Response Time"
          value={`${stats?.averageResponseTime || 0}m`}
          icon={Timer}
          color="purple"
          description={`Target: 30m`}
        />
      </div>

      {/* SLA Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            SLA Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900">{stats?.slaComplianceRate || 0}%</p>
              <p className="text-sm text-gray-600 mt-1">SLA Compliance</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{slaMetrics?.withinSLA || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Within SLA</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{slaMetrics?.atRisk || 0}</p>
              <p className="text-sm text-gray-600 mt-1">At Risk</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{slaMetrics?.breached || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Breached</p>
            </div>
          </div>
          
          {/* SLA Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Response Time Target</span>
              <span>{slaMetrics?.averageResponseTime || 0}m / {slaMetrics?.targetResponseTime || 30}m</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(((slaMetrics?.averageResponseTime || 0) / (slaMetrics?.targetResponseTime || 30)) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Pending Cases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Cases Awaiting Review
          </CardTitle>
          <Link to="/cases">
            <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseData={caseItem} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper Components
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  description?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CaseCardProps {
  caseData: Case;
}

const CaseCard: React.FC<CaseCardProps> = ({ caseData }) => {
  const waitTime = Math.round((new Date().getTime() - new Date(caseData.createdAt).getTime()) / (1000 * 60));
  const slaStatus = waitTime <= 21 ? 'OnTrack' : waitTime <= 30 ? 'AtRisk' : 'Breached';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="font-medium text-gray-900">{caseData.patientName}</h4>
          <Badge className={getPriorityColor(caseData.priority)}>
            {caseData.priority}
          </Badge>
          <Badge className={getSLAColor(slaStatus)} size="sm">
            {slaStatus === 'OnTrack' ? 'On Track' : slaStatus === 'AtRisk' ? 'At Risk' : 'SLA Breached'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{caseData.symptoms}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span>{caseData.caseNumber}</span>
          <span>•</span>
          <span>{caseData.pmvName}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(caseData.createdAt)}
          </span>
        </div>
      </div>
      <Link to={`/cases/${caseData.id}`}>
        <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
          Review
        </Button>
      </Link>
    </div>
  );
};

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export default DashboardPage;
