import React, { useState } from 'react';
import { X, ChevronDown, Film, Tv, Sparkles, FolderHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (section: string, category: string | null) => void;
  activeSection: string | null;
  activeCategory: string | null;
}

const SECTIONS = [
  { id: 'أفلام', label: 'أفلام', icon: Film },
  { id: 'أنمي', label: 'أنمي', icon: Sparkles },
  { id: 'أنميشن', label: 'أنميشن', icon: FolderHeart },
  { id: 'مسلسلات', label: 'مسلسلات', icon: Tv }
];

const SUBCATEGORIES = [
  "أكشن", "فانتازيا", "رعب", "خيال علمي", "كوميديا", 
  "دراما", "إثارة وتشويق", "غموض وجريمة", "رومانسية", 
  "مغامرة", "سيرة ذاتية", "تاريخي", "حربي", "رعب نفسي", 
  "كوميديا سوداء", "دراما نفسية", "أكشن كوميدي", 
  "رعب خيال علمي", "فانتازيا ملحمية"
];

export default function Sidebar({
  isOpen,
  onClose,
  onSelectCategory,
  activeSection,
  activeCategory
}: SidebarProps) {
  // Store which section's submenu is currently expanded
  const [expandedSection, setExpandedSection] = useState<string | null>(activeSection);

  const toggleSubmenu = (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
    }
  };

  const handleCategoryClick = (sectionId: string, cat: string | null) => {
    onSelectCategory(sectionId, cat);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            id="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
          />

          {/* Sidebar Panel - sliding from right in RTL */}
          <motion.aside
            id="sidebar-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-screen w-[280px] bg-[#0c0c0e] border-l border-zinc-800/80 shadow-2xl z-50 flex flex-col text-right overflow-hidden"
            dir="rtl"
          >
            {/* Header with Close Button aligned to the left (RTL) */}
            <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between min-h-[65px] bg-[#09090b]">
              <button
                id="close-sidebar-btn"
                onClick={onClose}
                className="text-red-500 hover:text-red-400 font-bold text-2xl transition-all duration-200 cursor-pointer p-1.5 hover:scale-110 ml-auto"
                aria-label="إغلاق القائمة"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            {/* Menu Lists */}
            <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
              <div className="mb-4 px-2">
                <button
                  id="show-all-btn"
                  onClick={() => {
                    onSelectCategory('', null);
                    onClose();
                  }}
                  className={`w-full text-right px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-between border cursor-pointer active:scale-[0.98] ${
                    !activeSection 
                      ? 'bg-red-600/10 text-red-400 border-red-500/20' 
                      : 'bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 border-zinc-800/40'
                  }`}
                >
                  <span>📺 عرض جميع المواد بالمكتبة</span>
                </button>
              </div>

              <ul className="space-y-1.5">
                {SECTIONS.map(sec => {
                  const Icon = sec.icon;
                  const isExpanded = expandedSection === sec.id;
                  const isSectionActive = activeSection === sec.id;

                  return (
                    <li key={sec.id} className="border border-zinc-800/30 rounded-xl overflow-hidden bg-zinc-900/10">
                      <button
                        onClick={() => toggleSubmenu(sec.id)}
                        className={`w-full px-4 py-3 text-right text-xs font-bold cursor-pointer flex justify-between items-center transition ${
                          isSectionActive 
                            ? 'text-red-400 bg-red-600/5' 
                            : 'text-zinc-200 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isSectionActive ? 'text-red-500' : 'text-zinc-400'}`} />
                          <span>{sec.label}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-red-500' : ''}`} />
                      </button>

                      {/* Submenu with height animation */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="bg-[#050507]/60 overflow-hidden border-t border-zinc-800/20"
                          >
                            {/* All category under section */}
                            <li>
                              <button
                                onClick={() => handleCategoryClick(sec.id, null)}
                                className={`w-full py-2.5 pr-10 pl-4 text-right text-[11px] font-semibold transition cursor-pointer hover:bg-zinc-900/40 hover:text-white ${
                                  isSectionActive && !activeCategory 
                                    ? 'text-red-400 bg-red-950/20' 
                                    : 'text-zinc-400'
                                }`}
                              >
                                {`كل ال${sec.label}`}
                              </button>
                            </li>

                            {/* Subcategories */}
                            {SUBCATEGORIES.map(cat => {
                              const isCatActive = isSectionActive && activeCategory === cat;
                              return (
                                <li key={cat}>
                                  <button
                                    onClick={() => handleCategoryClick(sec.id, cat)}
                                    className={`w-full py-2 pr-10 pl-4 text-right text-[11px] transition cursor-pointer hover:bg-zinc-900/40 hover:text-white ${
                                      isCatActive 
                                        ? 'text-red-400 bg-red-950/20 font-bold' 
                                        : 'text-zinc-400 font-normal'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                </li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
