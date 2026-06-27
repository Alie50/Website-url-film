import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Film, Tv, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { MediaItem, Episode, VideoType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
  editingItem?: MediaItem | null;
}

const VIDEO_TYPES: { value: VideoType; label: string }[] = [
  { value: 'auto', label: 'التعرف التلقائي الذكي على الرابط (موصى به ✨)' },
  { value: 'direct', label: 'رابط فيديو مباشر (MP4/Stream)' },
  { value: 'youtube', label: 'يوتيوب (YouTube Video/Shorts)' },
  { value: 'vimeo', label: 'فيميو (Vimeo Video)' },
  { value: 'iframe', label: 'تضمين خارجي مخصص (Iframe Embed)' }
];

export default function ItemFormModal({ isOpen, onClose, onSave, editingItem }: ItemFormModalProps) {
  const [type, setType] = useState<'movie' | 'series'>('movie');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [section, setSection] = useState('أفلام');
  const [category, setCategory] = useState('أكشن');
  
  // Movie specific state
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('auto');
  
  // Series specific state (episodes list)
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  // Sub-form for adding a single episode
  const [epTitle, setEpTitle] = useState('');
  const [epNumber, setEpNumber] = useState(1);
  const [epSeason, setEpSeason] = useState(1);
  const [epVideoUrl, setEpVideoUrl] = useState('');
  const [epVideoType, setEpVideoType] = useState<VideoType>('auto');
  const [showAddEpForm, setShowAddEpForm] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setDescription(editingItem.description || '');
      setPosterUrl(editingItem.posterUrl || '');
      setSection(editingItem.section || (editingItem.type === 'movie' ? 'أفلام' : 'مسلسلات'));
      setCategory(editingItem.category || 'أكشن');
      
      if (editingItem.type === 'movie') {
        setVideoUrl(editingItem.videoUrl || '');
        setVideoType(editingItem.videoType || 'auto');
        setEpisodes([]);
      } else {
        setVideoUrl('');
        setVideoType('auto');
        setEpisodes(editingItem.episodes || []);
      }
    } else {
      // Reset to defaults
      setType('movie');
      setTitle('');
      setDescription('');
      setPosterUrl('');
      setSection('أفلام');
      setCategory('أكشن');
      setVideoUrl('');
      setVideoType('auto');
      setEpisodes([]);
    }
    setShowAddEpForm(false);
    clearEpisodeForm();
  }, [editingItem, isOpen]);

  const clearEpisodeForm = () => {
    setEpTitle('');
    setEpNumber(episodes.length > 0 ? Math.max(...episodes.map(e => e.episodeNumber)) + 1 : 1);
    setEpSeason(episodes.length > 0 ? episodes[episodes.length - 1].seasonNumber : 1);
    setEpVideoUrl('');
    setEpVideoType('auto');
  };

  const handleAddEpisode = () => {
    if (!epTitle.trim()) {
      alert('الرجاء إدخال عنوان الحلقة');
      return;
    }
    if (!epVideoUrl.trim()) {
      alert('الرجاء إدخال رابط فيديو الحلقة');
      return;
    }

    const newEp: Episode = {
      id: `ep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: epTitle,
      episodeNumber: Number(epNumber),
      seasonNumber: Number(epSeason),
      videoUrl: epVideoUrl,
      videoType: epVideoType,
      createdAt: new Date().toISOString()
    };

    setEpisodes([...episodes, newEp].sort((a, b) => {
      if (a.seasonNumber !== b.seasonNumber) return a.seasonNumber - b.seasonNumber;
      return a.episodeNumber - b.episodeNumber;
    }));
    
    clearEpisodeForm();
    setShowAddEpForm(false);
  };

  const handleDeleteEpisode = (id: string) => {
    setEpisodes(episodes.filter(ep => ep.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('الرجاء إدخال عنوان المادة');
      return;
    }

    if (type === 'movie' && !videoUrl.trim()) {
      alert('الرجاء إدخال رابط الفيديو للفيلم');
      return;
    }

    if (type === 'series' && episodes.length === 0) {
      alert('الرجاء إضافة حلقة واحدة على الأقل للمسلسل');
      return;
    }

    // Default high quality movie poster if empty
    const finalPoster = posterUrl.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80';

    const itemData: MediaItem = {
      id: editingItem?.id || '',
      type,
      title,
      description,
      posterUrl: finalPoster,
      section,
      category,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      ...(type === 'movie' ? { videoUrl, videoType } : { episodes })
    };

    onSave(itemData);
  };

  if (!isOpen) return null;

  return (
    <div id="item-form-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
      <motion.div
        id="item-form-modal-box"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-8 text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition bg-[#050507] p-2 rounded-xl border border-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-zinc-100">
            {editingItem ? 'تعديل مادة عرض' : 'إضافة فيلم أو مسلسل جديد'}
          </h2>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Type Selector (Movie or Series) */}
          {!editingItem && (
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                نوع المحتوى
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  id="select-type-movie"
                  type="button"
                  onClick={() => setType('movie')}
                  className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer active:scale-95 ${
                    type === 'movie'
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/20'
                      : 'bg-[#050507] text-zinc-500 border-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>فيلم سينمائي</span>
                </button>
                <button
                  id="select-type-series"
                  type="button"
                  onClick={() => setType('series')}
                  className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer active:scale-95 ${
                    type === 'series'
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/20'
                      : 'bg-[#050507] text-zinc-500 border-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>مسلسل تلفزيوني</span>
                </button>
              </div>
            </div>
          )}

          {/* Standard Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                العنوان
              </label>
              <input
                id="item-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: فيلم الرسالة أو مسلسل فريندز"
                className="w-full px-4 py-3 bg-[#050507] border border-zinc-800 focus:border-red-600 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none transition text-right text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                الوصف القصير والقصة
              </label>
              <textarea
                id="item-desc-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="أدخل ملخصاً أو قصة العمل السينمائي..."
                rows={3}
                className="w-full px-4 py-3 bg-[#050507] border border-zinc-800 focus:border-red-600 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none transition text-right text-xs resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                رابط غلاف المادة (الملصق / Poster)
              </label>
              <input
                id="item-poster-input"
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="رابط غلاف الفيلم (اختياري، سيتم تعيين غلاف افتراضي أنيق إن تركته فارغاً)"
                className="w-full px-4 py-3 bg-[#050507] border border-zinc-800 focus:border-red-600 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none transition text-left text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  قسم المادة (الرئيسي)
                </label>
                <select
                  id="item-section-select"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-4 py-3 bg-[#050507] border border-zinc-800 focus:border-red-600 rounded-xl text-zinc-100 focus:outline-none transition text-right text-xs"
                >
                  <option value="أفلام">أفلام</option>
                  <option value="أنمي">أنمي</option>
                  <option value="أنميشن">أنميشن</option>
                  <option value="مسلسلات">مسلسلات</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  التصنيف الفرعي
                </label>
                <select
                  id="item-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-[#050507] border border-zinc-800 focus:border-red-600 rounded-xl text-zinc-100 focus:outline-none transition text-right text-xs"
                >
                  {[
                    "أكشن", "فانتازيا", "رعب", "خيال علمي", "كوميديا", 
                    "دراما", "إثارة وتشويق", "غموض وجريمة", "رومانسية", 
                    "مغامرة", "سيرة ذاتية", "تاريخي", "حربي", "رعب نفسي", 
                    "كوميديا سوداء", "دراما نفسية", "أكشن كوميدي", 
                    "رعب خيال علمي", "فانتازيا ملحمية"
                  ].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Type Specific Fields: MOVIE */}
          {type === 'movie' && (
            <div className="p-4 bg-[#050507] border border-zinc-800 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-red-500 flex items-center gap-2">
                <Play className="w-3.5 h-3.5" />
                <span>بيانات تشغيل الفيديو للفيلم</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-2">
                    نوع مزود البث
                  </label>
                  <select
                    id="movie-video-type-select"
                    value={videoType}
                    onChange={(e) => setVideoType(e.target.value as VideoType)}
                    className="w-full px-4 py-3 bg-[#0c0c0e] border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-red-600 transition text-xs"
                  >
                    {VIDEO_TYPES.map(vt => (
                      <option key={vt.value} value={vt.value} className="bg-[#0c0c0e]">{vt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 mb-2">
                    رابط ملف الفيديو أو كود التضمين
                  </label>
                  <input
                    id="movie-video-url-input"
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={
                      videoType === 'auto' ? 'ضع أي رابط من أي منصة (يوتيوب، فيميو، بث مباشر، Stmruby، جوجل درايف، إلخ) وسيتم التعرف عليه تلقائياً' :
                      videoType === 'direct' ? 'مثال: https://example.com/movie.mp4' :
                      videoType === 'youtube' ? 'مثال: https://www.youtube.com/watch?v=dQw4w9WgXcQ' :
                      videoType === 'vimeo' ? 'مثال: https://vimeo.com/76979871' :
                      'مثال: رابط Stmruby (https://stmruby.com/embed-...) أو رابط iframe خارجي'
                    }
                    className="w-full px-4 py-3 bg-[#0c0c0e] border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-red-600 transition text-left text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Type Specific Fields: SERIES (Episodes manager) */}
          {type === 'series' && (
            <div className="p-4 bg-[#050507] border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <button
                  id="toggle-add-episode-btn"
                  type="button"
                  onClick={() => setShowAddEpForm(!showAddEpForm)}
                  className="px-3 py-1.5 text-[11px] font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center gap-1 shadow-md shadow-red-950/20 cursor-pointer active:scale-95 transition"
                >
                  {showAddEpForm ? 'إلغاء' : 'إضافة حلقة جديدة'}
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <h3 className="text-xs font-bold text-red-500 flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5" />
                  <span>إدارة حلقات المسلسل ({episodes.length} حلقة مضافة)</span>
                </h3>
              </div>

              {/* Add Episode Panel */}
              <AnimatePresence>
                {showAddEpForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-zinc-800 bg-[#0c0c0e]/80 p-4 rounded-xl space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                          رقم الموسم
                        </label>
                        <input
                          id="ep-season-input"
                          type="number"
                          min="1"
                          value={epSeason}
                          onChange={(e) => setEpSeason(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#050507] border border-zinc-800 rounded-xl text-zinc-100 text-center text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                          رقم الحلقة
                        </label>
                        <input
                          id="ep-number-input"
                          type="number"
                          min="1"
                          value={epNumber}
                          onChange={(e) => setEpNumber(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#050507] border border-zinc-800 rounded-xl text-zinc-100 text-center text-xs"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                          عنوان الحلقة
                        </label>
                        <input
                          id="ep-title-input"
                          type="text"
                          value={epTitle}
                          onChange={(e) => setEpTitle(e.target.value)}
                          placeholder="مثال: حلقة 1: البداية"
                          className="w-full px-3 py-2 bg-[#050507] border border-zinc-800 rounded-xl text-zinc-100 text-right text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                          نوع المشغل
                        </label>
                        <select
                          id="ep-video-type-select"
                          value={epVideoType}
                          onChange={(e) => setEpVideoType(e.target.value as VideoType)}
                          className="w-full px-3 py-2 bg-[#050507] border border-zinc-800 rounded-xl text-zinc-200 text-xs"
                        >
                          {VIDEO_TYPES.map(vt => (
                            <option key={vt.value} value={vt.value} className="bg-[#050507]">{vt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                          رابط تشغيل الحلقة
                        </label>
                        <input
                          id="ep-video-url-input"
                          type="text"
                          value={epVideoUrl}
                          onChange={(e) => setEpVideoUrl(e.target.value)}
                          placeholder={
                            epVideoType === 'auto' ? 'ضع أي رابط من أي منصة (يوتيوب، فيميو، بث مباشر، Stmruby، جوجل درايف، إلخ) وسيتم التعرف عليه تلقائياً' :
                            epVideoType === 'direct' ? 'رابط ملف فيديو مباشر (مثال: .mp4)' :
                            epVideoType === 'youtube' ? 'رابط يوتيوب (مثال: youtube.com/watch?v=...)' :
                            epVideoType === 'vimeo' ? 'رابط فيميو (مثال: vimeo.com/...)' :
                            'رابط مضمن مخصص (iframe أو رابط خارجي)'
                          }
                          className="w-full px-3 py-2 bg-[#050507] border border-zinc-800 rounded-xl text-zinc-100 text-left text-xs"
                        />
                      </div>
                    </div>
                    <button
                      id="save-episode-btn"
                      type="button"
                      onClick={handleAddEpisode}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-zinc-100 rounded-xl font-bold border border-zinc-850 text-[11px] flex items-center justify-center gap-1 cursor-pointer transition active:scale-98"
                    >
                      <span>تأكيد وحفظ الحلقة بالقائمة</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Episodes List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {episodes.length === 0 ? (
                  <p className="text-zinc-600 text-xs text-center py-6">
                    لا توجد حلقات مضافة حالياً. يرجى إضافة حلقات لهذا المسلسل للتمكن من توليد الروابط لها.
                  </p>
                ) : (
                  episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="p-3 bg-[#0c0c0e] border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-between text-xs"
                    >
                      <button
                        id={`delete-episode-${ep.id}`}
                        type="button"
                        onClick={() => handleDeleteEpisode(ep.id)}
                        className="text-zinc-500 hover:text-red-400 p-1.5 bg-[#050507] rounded-lg border border-zinc-800 hover:border-red-900/40 transition cursor-pointer active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-right">
                        <div className="font-bold text-zinc-300">
                          الموسم {ep.seasonNumber} • الحلقة {ep.episodeNumber}: {ep.title}
                        </div>
                        <div className="text-[10px] text-zinc-600 text-left font-mono max-w-sm truncate mt-0.5" dir="ltr">
                          {ep.videoUrl}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-6 border-t border-zinc-800/80 bg-[#050507] flex gap-4">
          <button
            id="item-submit-btn"
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-950/20 transition cursor-pointer active:scale-98"
          >
            {editingItem ? 'تحديث وتعديل البيانات' : 'حفظ المادة الجديدة بالمكتبة'}
          </button>
          <button
            id="cancel-modal-btn"
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-[#0c0c0e] hover:bg-[#121215] text-zinc-400 hover:text-zinc-300 border border-zinc-800 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
}
