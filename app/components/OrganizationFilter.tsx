'use client';

import { Building2 } from 'lucide-react';
import { ORGANIZATIONS } from '../../lib/organizations';
import { useLanguage } from '../contexts/LanguageContext';
import { ORG_FILTER_ALL, ORG_FILTER_NONE, useDashboardStats } from '../contexts/DashboardStatsContext';

/** Dashboard'un tamamını (kartlar, grafik, sıralamalar, kullanıcı listesi) kuruma göre filtreler. */
export default function OrganizationFilter() {
  const { allUsers, organizationFilter, setOrganizationFilter, loading } = useDashboardStats();
  const { t } = useLanguage();

  if (loading || allUsers.length === 0) return null;

  const untagged = allUsers.filter((u) => !u.organization).length;
  const options = [
    { value: ORG_FILTER_ALL, label: t.allOrganizations, count: allUsers.length },
    ...ORGANIZATIONS.map((org) => ({
      value: org as string,
      label: org as string,
      count: allUsers.filter((u) => u.organization === org).length,
    })),
    ...(untagged > 0 || organizationFilter === ORG_FILTER_NONE
      ? [{ value: ORG_FILTER_NONE, label: t.noOrganization, count: untagged }]
      : []),
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3" role="group" aria-label={t.organization}>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-300" strokeWidth={1.8} />
        {t.organization}
      </span>
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white/80 p-1 dark:border-teal-500/20 dark:bg-slate-900/70">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setOrganizationFilter(o.value)}
            aria-pressed={organizationFilter === o.value}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${organizationFilter === o.value
              ? 'bg-teal-600 text-white dark:bg-teal-500/90 dark:text-slate-950'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}
          >
            {o.label} <span className="opacity-70">({o.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
