'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { Smartphone } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useLanguage } from '../contexts/LanguageContext';

export interface AndroidRequest {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  status: 'new' | 'added';
  createdAt: string | null;
}

export function useAndroidRequests() {
  const [requests, setRequests] = useState<AndroidRequest[]>([]);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/android-requests', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      setRequests(((await res.json()) as { requests: AndroidRequest[] }).requests ?? []);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = useCallback(async (id: string, status: AndroidRequest['status']) => {
    let previous: AndroidRequest['status'] | undefined;
    setRequests((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      previous = r.status;
      return { ...r, status };
    }));
    setSaveError(false);
    const res = await fetch('/api/admin/android-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch(() => null);
    if (!res?.ok) {
      // Undo the optimistic change and tell the admin it was not saved.
      setRequests((prev) => prev.map((r) => (r.id === id && previous ? { ...r, status: previous } : r)));
      setSaveError(true);
    }
  }, []);

  return { requests, error, saveError, setStatus };
}

export default function AndroidRequests({ data }: { data: ReturnType<typeof useAndroidRequests> }) {
  const { t, lang } = useLanguage();
  const { requests, error, saveError, setStatus } = data;
  const dateLocale = lang === 'tr' ? tr : enUS;

  return (
    <div className="atv-card overflow-hidden">
      <div className="border-b border-slate-200 p-6">
        <h3 className="flex items-center gap-3 text-lg font-semibold text-slate-900">
          <Smartphone className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
          {t.tabAndroidRequests}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{t.arHint}</p>
        {saveError && (
          <p role="alert" className="mt-2 text-sm text-red-600">{t.arSaveError}</p>
        )}
      </div>
      {error ? (
        <p className="p-8 text-center text-sm text-red-600">{t.errorOccurred}</p>
      ) : requests.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-400">{t.arEmpty}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="py-4 pl-6 font-medium text-slate-500">{t.arName}</TableHead>
                <TableHead className="py-4 font-medium text-slate-500">{t.arEmail}</TableHead>
                <TableHead className="py-4 font-medium text-slate-500">{t.organization}</TableHead>
                <TableHead className="py-4 font-medium text-slate-500">{t.arDate}</TableHead>
                <TableHead className="py-4 pr-6 font-medium text-slate-500">{t.arStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id} className="border-slate-200">
                  <TableCell className="py-4 pl-6 font-medium text-slate-900">{r.name}</TableCell>
                  <TableCell className="text-slate-700">{r.email}</TableCell>
                  <TableCell className="text-slate-600">{r.organization ?? '—'}</TableCell>
                  <TableCell className="text-slate-600">
                    {r.createdAt ? format(new Date(r.createdAt), 'd MMM yyyy HH:mm', { locale: dateLocale }) : '—'}
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${r.status === 'added' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-800'}`}
                      >
                        {r.status === 'added' ? t.arStatusAdded : t.arStatusNew}
                      </span>
                      <button
                        type="button"
                        onClick={() => void setStatus(r.id, r.status === 'added' ? 'new' : 'added')}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {r.status === 'added' ? t.arMarkNew : t.arMarkAdded}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
