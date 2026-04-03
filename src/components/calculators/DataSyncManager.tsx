import { useState, useRef, useEffect } from 'react';
import { Download, Upload, Check, AlertTriangle, HardDrive, Smartphone, FileJson, X, Trash2, ChevronDown, ChevronRight, Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// All localStorage keys that hold app data
const DATA_KEYS = [
  { key: 'chemanalyst-inventory', label: 'Chemical Inventory' },
  { key: 'chem-formulas-v2', label: 'Custom Formulas' },
  { key: 'chemanalyst-standards', label: 'Standards' },
  { key: 'chemanalyst-custom-sops', label: 'Custom SOPs' },
  { key: 'chemanalyst-edited-sops', label: 'Edited SOPs' },
  { key: 'chemanalyst-analytical-blocks', label: 'Analytical Test Blocks' },
  { key: 'chemanalyst-analytical-results', label: 'Analytical Results' },
  { key: 'chemanalyst-sidebar-order', label: 'Sidebar Order' },
  { key: 'calibration-curves', label: 'Calibration Curves' },
];

// Admin-only data keys (PDF sources)
const ADMIN_DATA_KEYS = [
  { key: 'chemanalyst-pdf-sources', label: 'PDF Reference Sources' },
];

interface ExportData {
  _meta: {
    version: string;
    exportedAt: string;
    deviceInfo: string;
  };
  data: Record<string, unknown>;
}

// Cloud Sync Sub-component (Admin only)
function CloudSyncSection({ allKeys }: { allKeys: { key: string; label: string }[] }) {
  const [cloudData, setCloudData] = useState<{ section_key: string; data: unknown; updated_at: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadKeys, setUploadKeys] = useState<Set<string>>(new Set());

  const fetchCloudData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('default_app_data').select('section_key, data, updated_at');
      if (error) throw error;
      setCloudData(data || []);
    } catch (err) {
      toast.error('Failed to fetch cloud data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCloudData(); }, []);

  const uploadToCloud = async () => {
    if (uploadKeys.size === 0) { toast.error('Select sections to upload'); return; }
    setUploading(true);
    try {
      const sections: Record<string, unknown> = {};
      for (const { key } of allKeys) {
        if (!uploadKeys.has(key)) continue;
        const raw = localStorage.getItem(key);
        if (raw) sections[key] = JSON.parse(raw);
      }
      const res = await supabase.functions.invoke('sync-data', {
        method: 'POST',
        body: { password: 'ChemAdmin2024', sections },
      });
      if (res.error) throw res.error;
      toast.success(`Uploaded ${Object.keys(sections).length} section(s) to cloud as defaults.`);
      fetchCloudData();
    } catch {
      toast.error('Failed to upload to cloud');
    } finally {
      setUploading(false);
    }
  };

  const deleteFromCloud = async (sectionKey: string) => {
    try {
      const res = await supabase.functions.invoke('sync-data', {
        method: 'POST',
        body: { password: 'ChemAdmin2024', action: 'delete', keys: [sectionKey] },
      });
      if (res.error) throw res.error;
      toast.success('Removed from cloud defaults');
      fetchCloudData();
    } catch {
      toast.error('Failed to delete from cloud');
    }
  };

  const loadCloudDefaults = () => {
    let loaded = 0;
    for (const item of cloudData) {
      const existing = localStorage.getItem(item.section_key);
      if (!existing) {
        localStorage.setItem(item.section_key, JSON.stringify(item.data));
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: item.section_key } }));
        loaded++;
      }
    }
    if (loaded > 0) toast.success(`Loaded ${loaded} default section(s) from cloud.`);
    else toast.info('All cloud defaults are already present locally.');
  };

  const toggleUploadKey = (key: string) => {
    setUploadKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="glass-panel rounded-lg">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Cloud Sync (Admin)</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCloudData} disabled={loading} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Refresh">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-xs text-muted-foreground">Upload local data to cloud as <span className="text-foreground font-medium">default data</span> for all users. Cloud defaults load automatically when a section has no local data.</p>

        {/* Cloud status */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Currently in Cloud</p>
          {cloudData.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-2">No data uploaded yet.</p>
          ) : (
            cloudData.map(item => {
              const def = allKeys.find(d => d.key === item.section_key);
              return (
                <div key={item.section_key} className="flex items-center justify-between px-3 py-2 rounded-md bg-primary/5 border border-primary/20">
                  <div>
                    <span className="text-xs font-medium text-foreground">{def?.label || item.section_key}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => deleteFromCloud(item.section_key)} className="p-1 text-destructive/60 hover:text-destructive transition-colors" title="Remove from cloud">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Load cloud defaults */}
        {cloudData.length > 0 && (
          <button onClick={loadCloudDefaults} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 border border-border transition-colors">
            <Download className="w-3.5 h-3.5" /> Load Cloud Defaults Locally
          </button>
        )}

        {/* Upload sections */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Upload to Cloud</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {allKeys.map(({ key, label }) => {
              const raw = localStorage.getItem(key);
              const hasData = !!raw;
              return (
                <button
                  key={key}
                  onClick={() => hasData && toggleUploadKey(key)}
                  disabled={!hasData}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-left text-xs transition-all ${
                    uploadKeys.has(key) ? 'border-primary/40 bg-primary/5 text-foreground' : hasData ? 'border-border text-muted-foreground hover:border-primary/20' : 'border-border/30 text-muted-foreground/30 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${uploadKeys.has(key) ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {uploadKeys.has(key) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>
                    <span className="font-medium">{label}</span>
                  </div>
                  {!hasData && <span className="text-[10px]">empty</span>}
                </button>
              );
            })}
          </div>
          <button
            onClick={uploadToCloud}
            disabled={uploadKeys.size === 0 || uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload {uploadKeys.size} Section{uploadKeys.size !== 1 ? 's' : ''} to Cloud
          </button>
        </div>
      </div>
    </div>
  );
}

export function DataSyncManager({ isAdmin = false }: { isAdmin?: boolean }) {
  const allKeys = isAdmin ? [...DATA_KEYS, ...ADMIN_DATA_KEYS] : DATA_KEYS;
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(allKeys.map(d => d.key)));
  const [importPreview, setImportPreview] = useState<ExportData | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importSelectedKeys, setImportSelectedKeys] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  // For browsing/removing specific items within a section
  const [expandedDataKey, setExpandedDataKey] = useState<string | null>(null);
  const [, setRefresh] = useState(0);

  const toggleKey = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelectedKeys(new Set(allKeys.map(d => d.key)));
  const selectNone = () => setSelectedKeys(new Set());

  // ── Export ──
  const handleExport = () => {
    const exportObj: ExportData = {
      _meta: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        deviceInfo: navigator.userAgent.slice(0, 80),
      },
      data: {},
    };

    let itemCount = 0;
    for (const { key } of allKeys) {
      if (!selectedKeys.has(key)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          exportObj.data[key] = parsed;
          itemCount++;
        }
      } catch { /* skip corrupted */ }
    }

    if (itemCount === 0) {
      toast.error('Nothing to export — no data found for selected sections.');
      return;
    }

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chembuddy-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${itemCount} section(s) — share this file with your other device.`);
  };

  // ── Import: file select ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as ExportData;
        if (!parsed._meta || !parsed.data) {
          toast.error('Invalid file format — not a ChemBuddy export.');
          return;
        }
        setImportPreview(parsed);
        setImportSelectedKeys(new Set(Object.keys(parsed.data)));
      } catch {
        toast.error('Failed to read file — make sure it\'s a valid JSON export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleImportKey = (key: string) => {
    setImportSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Import: apply ──
  const applyImport = () => {
    if (!importPreview) return;

    let imported = 0;
    for (const [key, value] of Object.entries(importPreview.data)) {
      if (!importSelectedKeys.has(key)) continue;

      try {
        if (importMode === 'replace') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          const existing = localStorage.getItem(key);
          if (!existing) {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            const existingParsed = JSON.parse(existing);
            if (Array.isArray(existingParsed) && Array.isArray(value)) {
              const isPrimitiveArray = existingParsed.every((item: unknown) => typeof item !== 'object');
              if (isPrimitiveArray) {
                const existingSet = new Set(existingParsed);
                const newItems = (value as unknown[]).filter(item => !existingSet.has(item));
                localStorage.setItem(key, JSON.stringify([...existingParsed, ...newItems]));
              } else {
                const existingIds = new Set(existingParsed.map((item: Record<string, unknown>) => item.id).filter(Boolean));
                const newItems = (value as Record<string, unknown>[]).filter(item => !item.id || !existingIds.has(item.id));
                localStorage.setItem(key, JSON.stringify([...existingParsed, ...newItems]));
              }
            } else if (typeof existingParsed === 'object' && typeof value === 'object' && !Array.isArray(value)) {
              localStorage.setItem(key, JSON.stringify({ ...existingParsed, ...(value as Record<string, unknown>) }));
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          }
        }
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key } }));
        imported++;
      } catch { /* skip */ }
    }

    toast.success(`Imported ${imported} section(s). Data is now available across the app.`);
    setImportPreview(null);
  };

  // ── Remove specific data items from a section ──
  const removeDataItem = (storageKey: string, itemIndex: number) => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.splice(itemIndex, 1);
        localStorage.setItem(storageKey, JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: storageKey } }));
        setRefresh(r => r + 1);
        toast.success('Item removed');
      }
    } catch { /* ignore */ }
  };

  const clearSectionData = (storageKey: string) => {
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new CustomEvent('local-storage-sync', { detail: { key: storageKey } }));
    setRefresh(r => r + 1);
    toast.success('Section data cleared');
  };

  const getDataStats = () => {
    const stats: { key: string; label: string; count: number | string }[] = [];
    for (const { key, label } of allKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const count = Array.isArray(parsed) ? parsed.length : typeof parsed === 'object' ? Object.keys(parsed).length : 1;
          stats.push({ key, label, count });
        } else {
          stats.push({ key, label, count: 0 });
        }
      } catch {
        stats.push({ key, label, count: '—' });
      }
    }
    return stats;
  };

  const getDataItems = (storageKey: string): { label: string; index: number }[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, idx: number) => ({
          label: item.name || item.analysis || item.title || item.label || item.id || `Item ${idx + 1}`,
          index: idx,
        }));
      }
    } catch { /* ignore */ }
    return [];
  };

  const stats = getDataStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-panel rounded-lg p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Data Transfer</h2>
            <p className="text-xs text-muted-foreground">Export data from this device and import it on another to keep everything in sync.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20">
          <HardDrive className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">How it works:</span> Export creates a JSON file you can share (via email, Drive, USB, etc). Import on the other device to load the same data.
          </p>
        </div>
      </div>

      {/* Section selector with data browsing */}
      <div className="glass-panel rounded-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Select Sections</h3>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-[10px] text-primary hover:text-primary/80 font-medium uppercase tracking-wider">All</button>
            <span className="text-muted-foreground/30">|</span>
            <button onClick={selectNone} className="text-[10px] text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider">None</button>
          </div>
        </div>
        <div className="p-4 space-y-1">
          {stats.map(({ key, label, count }) => (
            <div key={key}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleKey(key)}
                  className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-md border text-left transition-all ${
                    selectedKeys.has(key)
                      ? 'border-primary/40 bg-primary/5 text-foreground'
                      : 'border-border bg-secondary/30 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selectedKeys.has(key) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {selectedKeys.has(key) && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${count === 0 ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                    {count === 0 ? 'empty' : typeof count === 'number' ? `${count} items` : count}
                  </span>
                </button>
                {typeof count === 'number' && count > 0 && (
                  <button
                    onClick={() => setExpandedDataKey(expandedDataKey === key ? null : key)}
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Browse items"
                  >
                    {expandedDataKey === key ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
                {typeof count === 'number' && count > 0 && (
                  <button
                    onClick={() => { if (confirm(`Clear all ${label} data?`)) clearSectionData(key); }}
                    className="p-2 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Clear all data in this section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {/* Expanded item list for removal */}
              {expandedDataKey === key && (
                <div className="ml-8 mt-1 mb-2 space-y-0.5 max-h-40 overflow-y-auto">
                  {getDataItems(key).map(item => (
                    <div key={item.index} className="flex items-center justify-between px-3 py-1.5 rounded text-xs bg-secondary/30 border border-border/50">
                      <span className="text-foreground truncate mr-2">{item.label}</span>
                      <button
                        onClick={() => removeDataItem(key, item.index)}
                        className="p-0.5 text-destructive/60 hover:text-destructive transition-colors shrink-0"
                        title="Remove this item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {getDataItems(key).length === 0 && (
                    <p className="text-[10px] text-muted-foreground py-1 px-3">No browseable items</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export / Import actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export */}
        <div className="glass-panel rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Export Data</h3>
          </div>
          <p className="text-xs text-muted-foreground">Download selected sections as a JSON file to transfer to another device.</p>
          <button
            onClick={handleExport}
            disabled={selectedKeys.size === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export {selectedKeys.size} Section{selectedKeys.size !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Import */}
        <div className="glass-panel rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Import Data</h3>
          </div>
          <p className="text-xs text-muted-foreground">Load a previously exported JSON file to bring data into this device.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 border border-border transition-colors"
          >
            <FileJson className="w-4 h-4" />
            Choose File
          </button>
        </div>
      </div>

      {/* Import Preview Dialog */}
      {importPreview && (
        <div className="glass-panel rounded-lg border-2 border-primary/30">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Import Preview</h3>
            </div>
            <button onClick={() => setImportPreview(null)} className="p-1 rounded hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {/* Meta info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📅 Exported: <span className="text-foreground font-mono">{new Date(importPreview._meta.exportedAt).toLocaleString()}</span></p>
              <p>📱 From: <span className="text-foreground font-mono text-[10px]">{importPreview._meta.deviceInfo}</span></p>
            </div>

            {/* What's included — selectable */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">Select sections to import:</p>
              {Object.keys(importPreview.data).map(key => {
                const def = [...DATA_KEYS, ...ADMIN_DATA_KEYS].find(d => d.key === key);
                const val = importPreview.data[key];
                const count = Array.isArray(val) ? val.length : typeof val === 'object' && val ? Object.keys(val).length : 1;
                return (
                  <button
                    key={key}
                    onClick={() => toggleImportKey(key)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                      importSelectedKeys.has(key) ? 'bg-primary/5 text-foreground' : 'bg-secondary/30 text-muted-foreground line-through'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        importSelectedKeys.has(key) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                      }`}>
                        {importSelectedKeys.has(key) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span>{def?.label || key}</span>
                    </div>
                    <span className="font-mono text-[10px]">{count} items</span>
                  </button>
                );
              })}
            </div>

            {/* Merge vs Replace */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Import Mode:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-all ${
                    importMode === 'merge'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  🔄 Merge — add new items, keep existing
                </button>
                <button
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-all ${
                    importMode === 'replace'
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:border-destructive/30'
                  }`}
                >
                  ⚠️ Replace — overwrite with file data
                </button>
              </div>
            </div>

            {importMode === 'replace' && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">Replace mode will overwrite your current data for selected sections. This cannot be undone.</p>
              </div>
            )}

            <button
              onClick={applyImport}
              disabled={importSelectedKeys.size === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import {importSelectedKeys.size} Section{importSelectedKeys.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Cloud Sync Section - Admin Only */}
      {isAdmin && (
        <CloudSyncSection allKeys={allKeys} />
      )}

      {!isAdmin && (
        <div className="glass-panel rounded-lg p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span className="text-primary">ℹ️</span> You can export/import your own local data. Cloud sync and default data management requires admin login.
          </p>
        </div>
      )}
    </div>
  );
}
