import { useState, useEffect } from 'react';
import { Cloud, CloudUpload, Trash2, RefreshCw, Loader2, ChevronDown, ChevronRight, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SectionCloudSyncProps {
  sectionKey: string;
  label: string;
  isAdmin: boolean;
}

export function SectionCloudSync({ sectionKey, label, isAdmin }: SectionCloudSyncProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cloudData, setCloudData] = useState<any>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editJson, setEditJson] = useState('');

  const fetchCloudData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('default_app_data')
        .select('section_key, data, updated_at')
        .eq('section_key', sectionKey)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setCloudData(data.data);
        setCloudUpdatedAt(data.updated_at);
      } else {
        setCloudData(null);
        setCloudUpdatedAt(null);
      }
    } catch {
      toast.error(`Failed to fetch cloud data for ${label}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && isAdmin) fetchCloudData();
  }, [open, isAdmin]);

  if (!isAdmin) return null;

  const uploadToCloud = async () => {
    setUploading(true);
    try {
      const raw = localStorage.getItem(sectionKey);
      if (!raw) { toast.error(`No local data for ${label}`); return; }
      const sections: Record<string, unknown> = {};
      sections[sectionKey] = JSON.parse(raw);
      const res = await supabase.functions.invoke('sync-data', {
        method: 'POST',
        body: { password: 'ChemAdmin2024', sections },
      });
      if (res.error) throw res.error;
      toast.success(`${label} uploaded to cloud`);
      fetchCloudData();
    } catch {
      toast.error(`Failed to upload ${label}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteFromCloud = async () => {
    try {
      const res = await supabase.functions.invoke('sync-data', {
        method: 'POST',
        body: { password: 'ChemAdmin2024', action: 'delete', keys: [sectionKey] },
      });
      if (res.error) throw res.error;
      toast.success(`${label} removed from cloud`);
      setCloudData(null);
      setCloudUpdatedAt(null);
    } catch {
      toast.error(`Failed to delete ${label} from cloud`);
    }
  };

  const pullFromCloud = () => {
    if (!cloudData) return;
    localStorage.setItem(sectionKey, JSON.stringify(cloudData));
    toast.success(`${label} loaded from cloud to local`);
    window.dispatchEvent(new Event('storage'));
  };

  const startEdit = () => {
    setEditJson(JSON.stringify(cloudData, null, 2));
    setEditMode(true);
  };

  const saveEdit = async () => {
    try {
      const parsed = JSON.parse(editJson);
      const sections: Record<string, unknown> = {};
      sections[sectionKey] = parsed;
      const res = await supabase.functions.invoke('sync-data', {
        method: 'POST',
        body: { password: 'ChemAdmin2024', sections },
      });
      if (res.error) throw res.error;
      toast.success(`${label} cloud data updated`);
      setEditMode(false);
      fetchCloudData();
    } catch (e: any) {
      toast.error(e?.message || 'Invalid JSON or upload failed');
    }
  };

  const getItemCount = (data: any): string => {
    if (Array.isArray(data)) return `${data.length} items`;
    if (typeof data === 'object' && data !== null) return `${Object.keys(data).length} keys`;
    return 'data';
  };

  return (
    <div className="border border-border/50 rounded-md bg-muted/20">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Cloud className="w-3.5 h-3.5 text-primary" />
        <span>Cloud Sync</span>
        {cloudData && <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">synced</span>}
        {open ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
          {/* Actions */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={uploadToCloud}
              disabled={uploading}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudUpload className="w-3 h-3" />}
              Upload Local → Cloud
            </button>
            {cloudData && (
              <>
                <button
                  onClick={pullFromCloud}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Pull Cloud → Local
                </button>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={deleteFromCloud}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </>
            )}
            <button
              onClick={fetchCloudData}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </button>
          </div>

          {/* Cloud Data Info */}
          {cloudData ? (
            <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
              <p className="text-[10px] text-primary font-medium">
                ☁️ Cloud: {getItemCount(cloudData)}
              </p>
              {cloudUpdatedAt && (
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Last updated: {new Date(cloudUpdatedAt).toLocaleString()}
                </p>
              )}

              {/* Show items if array */}
              {Array.isArray(cloudData) && cloudData.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                  {cloudData.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] text-muted-foreground bg-background/50 rounded px-2 py-1">
                      <span className="truncate">
                        {item.name || item.title || item.id || item.analysis || item.sampleId || `Item ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">No cloud data for this section</p>
          )}

          {/* Edit Mode */}
          {editMode && (
            <div className="space-y-2">
              <textarea
                value={editJson}
                onChange={e => setEditJson(e.target.value)}
                className="w-full h-40 bg-input border border-border rounded-md px-2 py-1.5 text-[10px] font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
