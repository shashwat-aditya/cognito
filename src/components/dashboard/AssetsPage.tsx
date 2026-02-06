"use client";

import React, { useEffect, useState, useRef } from "react";
import { getProjectTheme } from "@/lib/actions/theme";
import { getUploadUrl, updateAssetUrl, deleteAsset } from "@/lib/actions/assets";
import { Loader2, Upload, X, Trash2, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "./ConfirmDialog";
import Image from "next/image";

interface AssetsPageProps {
  projectId: string;
}

interface AssetSlotProps {
  label: string;
  description: string;
  assetType: "splash" | "transition" | "logo";
  currentUrl: string | null;
  projectId: string;
  onUpdate: () => void;
}

const AssetSlot: React.FC<AssetSlotProps> = ({ label, description, assetType, currentUrl, projectId, onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPreview(currentUrl);
  }, [currentUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      // 1. Get Signed URL
      const { uploadUrl, publicUrl, readUrl } = await getUploadUrl(projectId, file.name, file.type);

      // 2. Perform Upload with Progress & Cancellation Support
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          await updateAssetUrl(projectId, assetType, publicUrl);
          setPreview(readUrl);
          onUpdate();
          setUploading(false);
        } else {
          setError(`Upload failed with status: ${xhr.status}`);
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setError("Network error occurred during upload.");
        setUploading(false);
      };

      xhr.onabort = () => {
        setError("Upload canceled.");
        setUploading(false);
      };

      // Handle cancellation via Ref
      abortControllerRef.current.signal.addEventListener("abort", () => {
        xhr.abort();
      });

      xhr.send(file);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDelete = async () => {
    if (!currentUrl) return;
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentUrl) return;

    try {
      // Extract GCS path from URL: https://storage.googleapis.com/bucket/path
      const urlObj = new URL(currentUrl);
      const path = urlObj.pathname.substring(1).split("/").slice(1).join("/"); // Remove bucket name from path
      
      await deleteAsset(projectId, assetType, path);
      setPreview(null);
      onUpdate();
    } catch (err: any) {
      setError("Failed to delete asset.");
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-bold text-white">{label}</h3>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        {preview && !uploading && (
          <button 
            onClick={handleDelete}
            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="relative aspect-video rounded-2xl bg-zinc-950 border border-white/5 overflow-hidden flex items-center justify-center group">
        {uploading ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 space-y-4 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-indigo-400">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-indigo-500"
                />
              </div>
            </div>
            <button 
              onClick={handleCancel}
              className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              Cancel Upload
            </button>
          </div>
        ) : preview ? (
          <>
            <Image src={preview} alt={label} fill unoptimized className="object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100">
               <label className="cursor-pointer bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20 transition-all">
                  Replace Image
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
               </label>
            </div>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center space-y-3 cursor-pointer p-8 w-full h-full hover:bg-white/5 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 transition-colors group-hover:text-indigo-400">
              <Upload size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-400">Click to upload</p>
              <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">PNG, JPG or WebP</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
          </label>
        )}

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold"
            >
              <AlertCircle size={14} />
              <span className="flex-1 truncate">{error}</span>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Asset"
        message={`Are you sure you want to permanently remove the ${label}? This action cannot be undone.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export const AssetsPage: React.FC<AssetsPageProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAssets = async () => {
    try {
      const theme = await getProjectTheme(projectId);
      setData(theme);
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-6 p-4">
      <div className="flex flex-col bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden h-full">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Asset Management</h1>
              <p className="text-xs text-zinc-500">Customize loaders, transitions, and branding</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AssetSlot 
              label="Splash Screen"
              description="Initial loader displayed when the session starts"
              assetType="splash"
              currentUrl={data?.splashUrl}
              projectId={projectId}
              onUpdate={fetchAssets}
            />
            <AssetSlot 
              label="Transition Screen"
              description="Displayed during transitions between nodes"
              assetType="transition"
              currentUrl={data?.transitionUrl}
              projectId={projectId}
              onUpdate={fetchAssets}
            />
            <AssetSlot 
              label="Default Logo"
              description="Brand logo displayed in the session header"
              assetType="logo"
              currentUrl={data?.logoUrl}
              projectId={projectId}
              onUpdate={fetchAssets}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
