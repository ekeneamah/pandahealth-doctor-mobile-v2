import { CasePriority, SLAStatus } from '@/src/types';

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days < 7) {
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks}w`;
}

export function getWaitTime(createdAt: string): string {
  const waitTime = Math.round(
    (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60)
  );
  return formatDuration(waitTime);
}

export function getPriorityColor(priority: CasePriority): { bg: string; text: string; border: string } {
  const colors: Record<CasePriority, { bg: string; text: string; border: string }> = {
    Low: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
    Medium: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
    High: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    Urgent: { bg: '#FEE2E2', text: '#7F1D1D', border: '#F87171' },
  };
  return colors[priority];
}

export function getSLAColor(status: SLAStatus): { bg: string; text: string } {
  const colors: Record<SLAStatus, { bg: string; text: string }> = {
    OnTrack: { bg: '#D1FAE5', text: '#065F46' },
    AtRisk: { bg: '#FEF3C7', text: '#B45309' },
    Breached: { bg: '#FEE2E2', text: '#DC2626' },
  };
  return colors[status];
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
