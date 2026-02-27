"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/utils/supabase/client";
import { Upload, X, Loader2, File, CheckCircle } from "lucide-react";

interface UploadProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (fileUrl: string) => Promise<void>;
}

export default function UploadProofModal({ isOpen, onClose, onSubmit }: UploadProofModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmittingTx, setIsSubmittingTx] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadAndSubmit = async () => {
        if (!file) {
            toast({ title: "No file selected", description: "Please select a proof file.", variant: "destructive" });
            return;
        }

        try {
            setIsUploading(true);
            // Generate a unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            // 1. Upload to Supabase Storage Bucket 'proofs'
            const { data, error } = await supabase.storage
                .from('proofs')
                .upload(filePath, file);

            if (error) throw error;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('proofs')
                .getPublicUrl(filePath);

            setIsUploading(false);
            setIsSubmittingTx(true);

            // 3. Submit proof transaction
            toast({ title: "File Uploaded", description: "Foundry signature detected. Confirming transaction..." });
            await onSubmit(publicUrl);

            toast({ title: "Success", description: "Proof submitted successfully." });
            setFile(null);
            onClose();

        } catch (err: any) {
            console.error(err);
            toast({ title: "Upload Error", description: err.message || "Failed to submit proof.", variant: "destructive" });
        } finally {
            setIsUploading(false);
            setIsSubmittingTx(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-slate-900">Upload Task Proof</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Submit your completed work. Uploaded files are hashed and secured in the decentralized vault.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-center w-full mt-4">
                    {!file ? (
                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-slate-400" />
                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-slate-400">PDF, ZIP, PNG, JPG (MAX. 50MB)</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    ) : (
                        <div className="flex items-center justify-between w-full p-4 border border-blue-100 rounded-xl bg-blue-50/50">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                <File className="w-8 h-8 text-blue-500 flex-shrink-0" />
                                <div className="flex flex-col truncate">
                                    <span className="text-sm font-semibold text-slate-700 truncate">{file.name}</span>
                                    <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
                    <Button variant="outline" onClick={onClose} disabled={isUploading || isSubmittingTx}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUploadAndSubmit}
                        disabled={!file || isUploading || isSubmittingTx}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                    >
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                        ) : isSubmittingTx ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                        ) : (
                            <><CheckCircle className="w-4 h-4 mr-2" /> Submit Proof</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
