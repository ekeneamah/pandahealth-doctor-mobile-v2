import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || 'DR';
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now.getTime() - then.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(date);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getSLAColor(status: 'OnTrack' | 'AtRisk' | 'Breached'): string {
  switch (status) {
    case 'OnTrack':
      return 'text-green-600 bg-green-50';
    case 'AtRisk':
      return 'text-yellow-600 bg-yellow-50';
    case 'Breached':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Low':
      return 'text-gray-600 bg-gray-100';
    case 'Medium':
      return 'text-blue-600 bg-blue-50';
    case 'High':
      return 'text-orange-600 bg-orange-50';
    case 'Urgent':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'AwaitingDoctor':
      return 'text-blue-600 bg-blue-50';
    case 'InReview':
      return 'text-purple-600 bg-purple-50';
    case 'Completed':
      return 'text-green-600 bg-green-50';
    case 'Cancelled':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getDrugTypeColor(type: string): string {
  switch (type) {
    case 'OTC':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'PrescriptionOnly':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'Controlled':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
