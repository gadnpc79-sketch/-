
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Square, MapPin, Send, X, Map, Trash2, Database, List, Activity } from 'lucide-react';
import ComplaintTable from './ComplaintTable';
import { supabase } from '../supabaseClient';

const ReceiverView = ({ complaints, profile, onBack, onBroadcast, onDelete }) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'database'

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === complaints.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(complaints.map(c => c.id));
        }
    };

    const openGoogleMaps = (e, coords) => {
        e.stopPropagation(); // Prevent row selection
        if (!coords) return;
        const [lng, lat] = coords;
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(url, '_blank');
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute top-0 right-0 h-full w-full md:w-[480px] bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-20 flex flex-col"
        >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        관리자 대시보드
                        {profile && <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white">{profile.adminId}</span>}
                    </h2>
                    <p className="text-sm text-slate-400">수신된 민원 관리 {profile && `(${profile.category})`}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode(viewMode === 'list' ? 'database' : 'list')}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                        title={viewMode === 'list' ? "데이터베이스 보기" : "리스트 보기"}
                    >
                        {viewMode === 'list' ? <Database size={20} /> : <List size={20} />}
                    </button>
                    <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>
            </div>

            {/* Control Bar (Only for List Mode) */}
            {viewMode === 'list' && (
                <div className="p-4 bg-slate-800/50 flex items-center justify-between">
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
                    >
                        {selectedIds.length === complaints.length && complaints.length > 0 ? (
                            <CheckSquare size={18} className="text-blue-500" />
                        ) : (
                            <Square size={18} />
                        )}
                        전체 선택
                    </button>
                    <div className="text-sm text-slate-500">
                        {selectedIds.length} 개 선택됨
                    </div>
                </div>
            )}

            {/* Content Area */}
            {viewMode === 'database' ? (
                <div className="flex-1 overflow-y-auto bg-slate-900 border-t border-white/5">
                    <ComplaintTable complaints={complaints} />
                </div>
            ) : (
                /* List View */
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {complaints.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            수신된 민원이 없습니다.
                        </div>
                    ) : (
                        complaints.map(complaint => (
                            <div
                                key={complaint.id}
                                className={`
                    relative group rounded-xl border p-4 transition-all
                    ${selectedIds.includes(complaint.id)
                                        ? 'bg-blue-500/10 border-blue-500/50'
                                        : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'}
                  `}
                            >
                                <div className="flex gap-4">
                                    {/* Checkbox */}
                                    <div className="mt-1" onClick={() => toggleSelect(complaint.id)}>
                                        {selectedIds.includes(complaint.id) ? (
                                            <CheckSquare size={20} className="text-blue-500 cursor-pointer" />
                                        ) : (
                                            <Square size={20} className="text-slate-600 group-hover:text-slate-400 cursor-pointer" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-slate-500">
                                                    {new Date(complaint.created_at || complaint.timestamp).toLocaleTimeString()}
                                                </span>
                                                {/* Status Badge */}
                                                <select
                                                    onClick={(e) => e.stopPropagation()}
                                                    value={complaint.status || 'none'}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        await supabase.from('complaints').update({ status: newStatus }).eq('id', complaint.id);
                                                    }}
                                                    className={`
                                                        text-xs font-bold px-2 py-0.5 rounded border-none outline-none cursor-pointer
                                                        ${complaint.status === 'received' ? 'bg-green-500/20 text-green-400' :
                                                            complaint.status === 'dispatched' ? 'bg-blue-500/20 text-blue-400' :
                                                                complaint.status === 'completed' ? 'bg-slate-500/20 text-slate-400 line-through' :
                                                                    'bg-slate-700 text-slate-400'}
                                                    `}
                                                >
                                                    <option value="none">대기</option>
                                                    <option value="received">접수</option>
                                                    <option value="dispatched">출동</option>
                                                    <option value="completed">완료</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete([complaint.id]); }}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors z-10"
                                                    title="삭제"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => openGoogleMaps(e, complaint.coords)}
                                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 transition-colors z-10"
                                                    title="구글 지도에서 위치 보기"
                                                >
                                                    <Map size={10} />
                                                    지도
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-slate-200 text-sm line-clamp-3 mb-3 whitespace-pre-wrap">
                                            {complaint.message}
                                        </p>

                                        {/* Location Info & Map */}
                                        <div className="mb-3 bg-slate-900/50 rounded-lg p-2 border border-white/5">
                                            <div className="flex items-center gap-2 mb-2 text-slate-300">
                                                <MapPin size={14} className="text-blue-400 shrink-0" />
                                                <span className="text-xs font-medium">{complaint.location}</span>
                                            </div>

                                            {/* Inline Map */}
                                            {complaint.coords && (
                                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-white/10 bg-slate-800">
                                                    <iframe
                                                        title={`Map for ${complaint.id}`}
                                                        width="100%"
                                                        height="100%"
                                                        frameBorder="0"
                                                        scrolling="no"
                                                        marginHeight="0"
                                                        marginWidth="0"
                                                        src={`https://maps.google.com/maps?q=${complaint.coords[1]},${complaint.coords[0]}&z=15&output=embed`}
                                                        className="absolute inset-0 w-full h-full"
                                                    />
                                                    <div className="absolute bottom-1 right-1 pointer-events-none">
                                                        <div className="bg-white/80 text-black text-[10px] px-1 rounded">Google Map Capture</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Photo */}
                                        {complaint.photo && (
                                            <div className="mt-3">
                                                <p className="text-xs text-slate-500 mb-1">첨부 사진</p>
                                                <div className="h-40 w-full rounded-lg bg-slate-800 overflow-hidden border border-white/10">
                                                    <img src={complaint.photo} alt="Attached" className="h-full w-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Action Footer (Only for List Mode) */}
            {viewMode === 'list' && (
                <div className="p-6 border-t border-white/5 bg-slate-900 grid grid-cols-2 gap-3">
                    <button
                        disabled={selectedIds.length === 0}
                        onClick={() => onDelete(selectedIds)}
                        className="w-full bg-red-500/10 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-red-500/20 text-red-400 border border-red-500/50 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} />
                        삭제 ({selectedIds.length})
                    </button>
                    <button
                        disabled={selectedIds.length === 0}
                        onClick={() => onBroadcast(selectedIds)}
                        className="w-full bg-blue-600 disabled:bg-slate-800 disabled:text-slate-500 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Send size={18} />
                        전송 ({selectedIds.length})
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default ReceiverView;
