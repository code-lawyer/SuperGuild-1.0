import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import ImageUpload from "@/components/ImageUpload";
import { useWaitForTransactionReceipt } from "wagmi";
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';
import { getNativeTokenSymbol } from '@/utils/chain';

interface BoardFormProps {
  initialData?: {
    id?: bigint;
    name: string;
    description: string;
    img: string;
    rewardToken: string;
    config?: string;
  };
  onSubmit: (data: any) => Promise<{ hash?: string }>;
  mode: 'create' | 'update';
  redirectPath?: string;
  isDialog?: boolean;
}

interface FormData {
  id?: bigint;
  name: string;
  description: string;
  img: string;
  tokenType: 'native' | 'erc20';
  rewardToken: string;
  channelId: string;
}

export default function BoardForm({ initialData, onSubmit, mode, redirectPath = '/boards', isDialog = false }: BoardFormProps) {

  const initialConfig = initialData?.config ? JSON.parse(initialData.config) : {};
  const [formData, setFormData] = useState<FormData>({
    id: initialData?.id,
    name: initialData?.name || "",
    description: initialData?.description || "",
    img: initialData?.img || "",
    tokenType: initialData?.rewardToken === zeroAddress ? 'native' : 'erc20',
    rewardToken: initialData?.rewardToken === zeroAddress ? "" : (initialData?.rewardToken || ""),
    channelId: initialConfig?.channelId || "",
  });

  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();
  const router = useRouter();
  const { toast } = useToast();
  const { chain } = useAccount();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error
  } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        rewardToken: formData.tokenType === 'native' ? zeroAddress : formData.rewardToken,
        config: JSON.stringify({
          channelId: formData.channelId
        })
      };

      if (mode === 'update' && initialData) {
        submitData.id = initialData.id;
      }

      const result = await onSubmit(submitData);
      if (result.hash) {
        setTransactionHash(result.hash as `0x${string}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit transaction",
        variant: "destructive",
      });
    }
  };

  // Monitor transaction status
  useEffect(() => {
    if (isConfirming) {
      toast({
        title: "Processing",
        description: (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span>Waiting for transaction confirmation...</span>
          </div>
        ),
      });
    } else if (isConfirmed) {
      toast({
        title: "Success!",
        description: `Board ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });

      // Send Discord announcement
      if (formData.channelId) {
        fetch('/api/discord-announcement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelId: formData.channelId,
            type: 'board_created',
            data: `Please introduce yourself and help us announce the new bounty board: Board Name: ${formData.name} Board Description: ${formData.description}`
          })
        }).catch(error => {
          console.error('Failed to send Discord announcement:', error);
        });
      }

      router.push(redirectPath);
    } else if (error) {
      toast({
        title: "Error",
        description: "Transaction failed",
        variant: "destructive",
      });
      setTransactionHash(undefined);
    }
  }, [isConfirming, isConfirmed, error, mode, redirectPath, router, toast, formData]);

  const formFields = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Quest Title</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder-slate-400"
            placeholder="e.g. Build 3D Asset Library for Game"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Category Tag (Optional)</label>
          <div className="relative">
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder-slate-400"
              placeholder="e.g. 3D Modeling"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Description</label>
        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex flex-col focus-within:ring-1 focus-within:border-slate-900 focus-within:ring-slate-900 transition-all shadow-sm">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full min-h-[160px] flex-1 bg-transparent p-4 text-sm text-slate-800 outline-none resize-y leading-relaxed"
            placeholder="Describe your bounty board scope of work..."
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Board Logo</label>
          <div className="max-w-[240px]">
            <ImageUpload
              value={formData.img}
              onChange={(url) => setFormData({ ...formData, img: url })}
              label="Board Logo"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Discord Channel ID (Waitlist & Updates)</label>
          <input
            type="text"
            value={formData.channelId}
            onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder-slate-400"
            placeholder="e.g. 123456789012345678"
          />
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-sm font-semibold text-slate-700">Reward Setup</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, tokenType: 'native', rewardToken: '' })}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border ${formData.tokenType === 'native' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            Native Token ({getNativeTokenSymbol(chain)})
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, tokenType: 'erc20' })}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors border ${formData.tokenType === 'erc20' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            ERC20 Token
          </button>
        </div>

        {formData.tokenType === 'erc20' && (
          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ERC20 Token Contract Address
            </label>
            <input
              type="text"
              value={formData.rewardToken}
              onChange={(e) => setFormData({ ...formData, rewardToken: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder-slate-400 font-mono"
              placeholder="0x..."
            />
          </div>
        )}
      </div>

      {isDialog && (
        <button
          type="submit"
          disabled={isConfirming}
          className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isConfirming ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            mode === 'create' ? 'Create Board' : 'Update Board'
          )}
        </button>
      )}
    </div>
  );

  if (isDialog) {
    return (
      <form onSubmit={handleSubmit} className="mt-4">
        {formFields}
      </form>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
    >
      <div className="col-span-1 lg:col-span-8 space-y-8">
        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shadow-md">1</div>
              <h2 className="text-xl font-semibold text-slate-900">Requirement Definition</h2>
            </div>
            <span className="text-xs font-medium text-slate-500 border border-slate-200 px-3 py-1.5 rounded-full bg-slate-50">Markdown Supported</span>
          </div>
          {formFields}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-400 flex items-center justify-center text-sm font-bold shadow-sm">2</div>
              <h2 className="text-xl font-semibold text-slate-900">Advanced Config</h2>
            </div>
          </div>
          <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center">
            <p className="text-sm text-slate-500 flex items-center gap-2"><span className="material-symbols-outlined text-xl">build</span> Advanced plugins coming soon in V2</p>
          </div>
        </section>
      </div>

      <div className="col-span-1 lg:col-span-4 space-y-6">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-200/50">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Summary</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Board Name</span>
                  <span className="font-semibold text-slate-900 max-w-[150px] truncate">{formData.name || 'Untitled'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Reward Token</span>
                  <span className="font-mono text-slate-900 font-medium">
                    {formData.tokenType === 'native' ? getNativeTokenSymbol(chain) : (formData.rewardToken ? `${formData.rewardToken.slice(0, 6)}...` : 'Unset')}
                  </span>
                </div>
                <div className="h-px w-full bg-slate-100 my-2"></div>
                <div className="flex justify-between items-center bg-slate-50 -mx-2 p-3 rounded-lg border border-slate-100">
                  <span className="text-sm font-semibold text-slate-700">Platform Fee</span>
                  <span className="font-mono text-emerald-600 font-medium">0.00%</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isConfirming}
                className="w-full bg-black hover:bg-slate-800 text-white font-medium py-3.5 rounded-xl shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 group transform active:scale-[0.98] disabled:opacity-50"
              >
                {isConfirming ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-white" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl group-hover:-translate-y-0.5 transition-transform">rocket_launch</span>
                    {mode === 'create' ? 'Deploy Board Contract' : 'Save Changes'}
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400 leading-tight">
                By deploying, you agree to the <a className="underline hover:text-black transition-colors" href="#">SuperGuild Protocol Rules</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
}