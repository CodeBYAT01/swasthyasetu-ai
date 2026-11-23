export const ROLES = {
  WORKER: 'worker',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
};

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', speech: 'en-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', speech: 'kn-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', speech: 'hi-IN' },
];

export const DEMO_ACCOUNTS = [
  {
    role: ROLES.WORKER,
    email: 'worker@swasthyasetu.ai',
    password: 'demo1234',
    name: 'Lakshmi N.',
    title: 'Frontline Health Worker',
    centre: 'Hosur Community Health Centre',
    initials: 'LN',
  },
  {
    role: ROLES.DOCTOR,
    email: 'doctor@swasthyasetu.ai',
    password: 'demo1234',
    name: 'Dr. Ananya Rao',
    title: 'Internal Medicine Specialist',
    centre: 'District Telemedicine Hub',
    initials: 'AR',
  },
  {
    role: ROLES.ADMIN,
    email: 'admin@swasthyasetu.ai',
    password: 'demo1234',
    name: 'Rajesh Kumar',
    title: 'Platform Administrator',
    centre: 'State Health Mission',
    initials: 'RK',
  },
];

export const NAV_ITEMS = {
  [ROLES.WORKER]: [
    { key: 'overview', path: '/app/overview', icon: 'LayoutDashboard' },
    { key: 'newConsultation', path: '/app/consultation/new', icon: 'Mic' },
    { key: 'patients', path: '/app/patients', icon: 'Users' },
    { key: 'referrals', path: '/app/referrals', icon: 'Send' },
    { key: 'doctorReview', path: '/app/review', icon: 'Stethoscope' },
    { key: 'syncCenter', path: '/app/sync', icon: 'RefreshCw' },
    { key: 'settings', path: '/app/settings', icon: 'Settings' },
  ],
  [ROLES.DOCTOR]: [
    { key: 'overview', path: '/app/overview', icon: 'LayoutDashboard' },
    { key: 'incomingReferrals', path: '/app/review', icon: 'Inbox' },
    { key: 'patients', path: '/app/patients', icon: 'Users' },
    { key: 'completedReviews', path: '/app/completed', icon: 'CheckCircle2' },
    { key: 'profile', path: '/app/settings', icon: 'Settings' },
  ],
  [ROLES.ADMIN]: [
    { key: 'overview', path: '/app/overview', icon: 'LayoutDashboard' },
    { key: 'userManagement', path: '/app/admin/users', icon: 'UserCog' },
    { key: 'healthCentres', path: '/app/admin/centres', icon: 'Building2' },
    { key: 'permissions', path: '/app/admin/permissions', icon: 'ShieldCheck' },
    { key: 'clinicalRules', path: '/app/admin/rules', icon: 'ClipboardList' },
    { key: 'auditLog', path: '/app/admin/audit', icon: 'ScrollText' },
    { key: 'syncMonitoring', path: '/app/admin/sync', icon: 'RefreshCw' },
  ],
};

export const REFERRAL_STATUSES = ['Created', 'Submitted', 'Acknowledged', 'Under Review', 'Advice Recorded', 'Closed'];
export const REFERRAL_PRIORITIES = ['Routine', 'Priority', 'Urgent'];

export const SYNC_STATUSES = ['Saved Locally', 'Pending Sync', 'Synchronized', 'Sync Failed'];

export const STATUS_STYLES = {
  // referral + generic statuses
  Created: 'bg-slate-100 text-slate-700 ring-slate-200',
  Submitted: 'bg-sky-50 text-sky-700 ring-sky-200',
  Acknowledged: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'Under Review': 'bg-amber-50 text-amber-800 ring-amber-200',
  'Advice Recorded': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  Urgent: 'bg-red-50 text-red-700 ring-red-200',
  Priority: 'bg-amber-50 text-amber-800 ring-amber-200',
  Routine: 'bg-slate-100 text-slate-600 ring-slate-200',
  'Saved Locally': 'bg-slate-100 text-slate-700 ring-slate-200',
  'Pending Sync': 'bg-amber-50 text-amber-800 ring-amber-200',
  Synchronized: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Sync Failed': 'bg-red-50 text-red-700 ring-red-200',
  Emergency: 'bg-red-50 text-red-700 ring-red-200',
  Review: 'bg-amber-50 text-amber-800 ring-amber-200',
  Incomplete: 'bg-slate-100 text-slate-700 ring-slate-200',
  Draft: 'bg-slate-100 text-slate-600 ring-slate-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export const SAFETY_LEVELS = {
  EMERGENCY: 'emergency',
  ASSESSMENT: 'assessment',
  INCOMPLETE: 'incomplete',
  NONE: 'none',
};

export const RULE_VERSION = 'DEMO-RULES-v0.3 (unreviewed)';
