export type UserRole = 'analyst' | 'senior_analyst' | 'admin' | 'viewer';

export interface NavItem {
  label: string;
  labelBn: string;
  href: string;
  icon: string;
  exact?: boolean;
  badge?: boolean; // Dynamic logic can be handled in component
  roles?: UserRole[]; // RBAC
}

export const NAV_CONFIG: NavItem[] = [
  {
    label: 'Dashboard',
    labelBn: 'ড্যাশবোর্ড',
    href: '/dashboard',
    icon: 'dashboard',
    exact: true,
    roles: ['viewer', 'analyst', 'senior_analyst', 'admin']
  },
  {
    label: 'Priority Inbox',
    labelBn: 'অগ্রাধিকার ইনবক্স',
    href: '/dashboard/investigate',
    icon: 'inbox',
    badge: true,
    roles: ['analyst', 'senior_analyst', 'admin']
  },
  {
    label: 'Case Files',
    labelBn: 'কেস ফাইল',
    href: '/dashboard/cases',
    icon: 'folder_managed',
    roles: ['analyst', 'senior_analyst', 'admin']
  },
  {
    label: 'Customer 360',
    labelBn: 'গ্রাহক প্রোফাইল',
    href: '/dashboard/profile/search',
    icon: 'hub',
    roles: ['analyst', 'senior_analyst', 'admin']
  },
  {
    label: 'Fraud Scanner',
    labelBn: 'স্ক্যানার',
    href: '/dashboard/simulator',
    icon: 'radar',
    roles: ['analyst', 'senior_analyst', 'admin']
  },
  {
    label: 'Policy Lab',
    labelBn: 'পলিসি ল্যাব',
    href: '/dashboard/sandbox',
    icon: 'science',
    roles: ['senior_analyst', 'admin'] // RBAC Restricted
  },
  {
    label: 'Model Health',
    labelBn: 'মডেল হেলথ',
    href: '/dashboard/model-health',
    icon: 'monitoring',
    roles: ['senior_analyst', 'admin'] // RBAC Restricted
  },
  {
    label: 'Model Training',
    labelBn: 'মডেল ট্রেনিং',
    href: '/dashboard/training',
    icon: 'school',
    roles: ['admin'] // RBAC Restricted
  },
  {
    label: 'Audit Logs',
    labelBn: 'অডিট লগ',
    href: '/dashboard/audit',
    icon: 'fact_check',
    roles: ['admin']
  }
];

export const BREADCRUMB_MAP: Record<string, { en: string; bn: string }> = {
  'dashboard': { en: 'Mission Control', bn: 'মিশন কন্ট্রোল' },
  'investigate': { en: 'Investigation Queue', bn: 'তদন্তের তালিকা' },
  'cases': { en: 'Case Management', bn: 'কেস ম্যানেজমেন্ট' },
  'profile': { en: 'Customer 360', bn: 'গ্রাহক প্রোফাইল' },
  'search': { en: 'Search', bn: 'অনুসন্ধান' },
  'simulator': { en: 'Fraud Scanner', bn: 'ফ্রড স্ক্যানার' },
  'sandbox': { en: 'Policy Lab', bn: 'পলিসি ল্যাব' },
  'model-health': { en: 'Model Diagnostics', bn: 'মডেল ডায়াগনস্টিকস' },
  'training': { en: 'Model Training', bn: 'মডেল ট্রেনিং' },
  'audit': { en: 'System Audit', bn: 'সিস্টেম অডিট' }
};

export const isUUID = (str: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

export const formatBreadcrumb = (segment: string, language: 'en' | 'bn'): string => {
  if (BREADCRUMB_MAP[segment]) {
    return BREADCRUMB_MAP[segment][language];
  }
  // Heuristic for IDs
  if (segment.length > 20 || segment.startsWith('C') || segment.startsWith('M')) {
    return language === 'bn' ? 'বিস্তারিত' : 'Details';
  }
  // Fallback: capitalize
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
};
