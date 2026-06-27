import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Film, Sparkles } from 'lucide-react';
import { MediaItem, ShareToken } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TokenGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    itemId: string;
    episodeId?: string;
    title: string;
    expiresHours?: number;
    maxViews?: number;
  }) => Promise<ShareToken | null>;
  items: MediaItem[];
  preselectedItem?: MediaItem | null;
}

export default function TokenGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  items,
  preselectedItem
}: TokenGeneratorModalProps) {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<ShareToken | null>(null);
  const [copied, setCopied] = useState(false);

  const currentItem = items.find(item => item.id === selectedItemId);

  const triggerInstantGenerate = async (itemId: string) => {
    if (!itemId) return;
    setIsGenerating(true);
    try {
      const token = await onGenerate({
        itemId,
        title: 'رابط مباشر',
      });
      if (token) {
        setGeneratedToken(token);
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء توليد الرابط');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setGeneratedToken(null);
      setCopied(false);
      
      if (preselectedItem) {
        setSelectedItemId(preselectedItem.id);
        triggerInstantGenerate(preselectedItem.id);
      } else {
        setSelectedItemId('');
      }
    }
  }, [isOpen, preselectedItem]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    triggerInstantGenerate(itemId);
  };

  const getFullShareLink = (tokenId: string) => {
    return `${window.location.origin}/watch/${tokenId}`;
  };

  const handleCopyLink = () => {
    if (!generatedToken) return;
    const link = getFullShareLink(generatedToken.id);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div id="token-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <motion.div
        id="token-modal-box"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <button
            id="close-token-modal"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition bg-[#050507] p-2 rounded-xl border border-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-bold text-zinc-100">
            {generatedToken ? 'رابط المشاهدة السري' : 'توليد رابط مشاهدة خاص'}
          </h2>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              /* LOADING STATE */
              <motion.div
                key="generating-loader"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 flex flex-col items-center justify-center space-y-4"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-red-600/10 border-t-red-600 animate-spin" />
                  <Sparkles className="w-5 h-5 text-amber-400 absolute animate-pulse" />
                </div>
                <div className="text-zinc-400 text-xs font-bold">جاري توليد الرابط السري الآن...</div>
              </motion.div>
            ) : !generatedToken ? (
              /* SELECT STATE (IF NO PRESELECTED) */
              <motion.div
                key="select-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 py-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                    اختر المادة المعروضة لتوليد الرابط فوراً
                  </label>
                  <select
                    id="token-item-select"
                    value={selectedItemId}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-[#050507] border border-zinc-855 rounded-xl text-zinc-200 focus:outline-none focus:border-red-600 transition text-xs"
                  >
                    <option value="" className="bg-[#0c0c0e]">-- اختر من القائمة للتوليد فوراً --</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id} className="bg-[#0c0c0e]">
                        {item.type === 'movie' ? '🎬 فيلم' : '📺 مسلسل'} : {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            ) : (
              /* SUCCESS VIEW (MATCHING THE RIGHT SIDE PICTURE) */
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 text-center"
              >
                {/* Subtle success toast */}
                <div className="flex items-center justify-center gap-2 py-1 px-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit mx-auto shadow-sm">
                  <div className="w-4.5 h-4.5 bg-emerald-500 rounded-full flex items-center justify-center text-[#050507]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="text-emerald-400 text-[11px] font-bold">تم توليد الرابط بنجاح!</span>
                </div>

                {/* Movie/Series card exactly matching the right side picture */}
                <div className="bg-[#050507] border border-zinc-850 rounded-2xl overflow-hidden shadow-xl max-w-sm mx-auto text-right">
                  {/* Poster Image */}
                  <div className="relative aspect-video w-full bg-[#0c0c0e] border-b border-zinc-900 overflow-hidden">
                    {currentItem?.posterUrl ? (
                      <img
                        src={currentItem.posterUrl}
                        alt={currentItem.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                        <Film className="w-10 h-10" />
                      </div>
                    )}
                    
                    {/* Poster Badge */}
                    <span className={`absolute top-3 right-3 px-2.5 py-0.5 text-[10px] font-bold rounded-full shadow-md z-10 ${
                      currentItem?.type === 'movie' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {currentItem?.type === 'movie' ? 'فيلم' : 'مسلسل'}
                    </span>
                  </div>

                  {/* Card Content details */}
                  <div className="p-4 space-y-1.5">
                    <h3 className="text-sm font-bold text-zinc-100 font-sans tracking-tight">
                      {currentItem?.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                      {currentItem?.description || 'لا يوجد ملخص أو قصة مضافة حالياً.'}
                    </p>
                  </div>
                </div>

                {/* Copy Box */}
                <div className="p-1 bg-[#050507] border border-zinc-850 rounded-xl flex items-center gap-2 max-w-sm mx-auto">
                  <button
                    id="copy-token-link-btn"
                    onClick={handleCopyLink}
                    className={`p-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer active:scale-95 ${
                      copied 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20' 
                        : 'bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                  <span className="text-[10px] font-mono text-zinc-500 truncate text-left w-full pl-3 pr-1" dir="ltr">
                    {getFullShareLink(generatedToken.id)}
                  </span>
                </div>

                {/* Footer buttons */}
                <div className="pt-2 flex gap-3 max-w-sm mx-auto text-xs font-bold">
                  {!preselectedItem && (
                    <button
                      id="generate-another-btn"
                      onClick={() => {
                        setGeneratedToken(null);
                        setSelectedItemId('');
                      }}
                      className="flex-1 py-2.5 bg-[#050507] hover:bg-zinc-900 text-zinc-300 rounded-xl transition border border-zinc-850 cursor-pointer active:scale-95 text-center"
                    >
                      توليد لعمل آخر
                    </button>
                  )}
                  <button
                    id="close-success-btn"
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition shadow-md shadow-red-950/20 cursor-pointer active:scale-95 text-center"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
