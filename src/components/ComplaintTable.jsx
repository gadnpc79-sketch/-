
import React, { useState } from 'react';
import { Save, Edit2, X, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ComplaintTable = ({ complaints }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Search Filters
    const [searchCategory, setSearchCategory] = useState('all');
    const [searchYear, setSearchYear] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [searchAddress, setSearchAddress] = useState('');

    // Statistics - Client Side Calculation
    // Calculates stats based on the currently loaded complaints (which allows for context-awareness if needed)
    // or we can calculate based on the full list passed in props.
    const stats = React.useMemo(() => {
        return complaints.reduce((acc, c) => {
            acc.total++;
            // Normalize category check (case-insensitive just in case, though app uses lowercase)
            const cat = c.category ? c.category.toLowerCase() : '';
            if (cat === 'roadkill') acc.roadkill++;
            else if (cat === 'trash') acc.trash++;
            else if (cat === 'fire') acc.fire++;
            return acc;
        }, { total: 0, roadkill: 0, trash: 0, fire: 0 });
    }, [complaints]);

    // Filter Logic
    const filteredComplaints = complaints.filter(c => {
        const dateObj = new Date(c.created_at || c.timestamp);
        const yearMatch = searchYear ? dateObj.getFullYear().toString() === searchYear : true;

        // Date match (YYYY-MM-DD)
        // c.created_at is ISO string, e.g. 2023-10-10T...
        const dateStr = dateObj.toISOString().split('T')[0];
        const dateMatch = searchDate ? dateStr === searchDate : true;

        const categoryMatch = searchCategory === 'all' ? true : c.category === searchCategory;
        const addressMatch = searchAddress ? (c.location && c.location.includes(searchAddress)) : true;

        return yearMatch && dateMatch && categoryMatch && addressMatch;
    });

    const handleEditClick = (complaint) => {
        setEditingId(complaint.id);
        setEditForm({
            location: complaint.location,
            latitude: complaint.coords ? complaint.coords[1] : 0,
            longitude: complaint.coords ? complaint.coords[0] : 0,
        });
    };

    const handleSave = async (id) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({
                    location: editForm.location,
                    coords: [parseFloat(editForm.longitude), parseFloat(editForm.latitude)]
                })
                .eq('id', id);

            if (error) throw error;
            setEditingId(null);
        } catch (err) {
            console.error('Update failed:', err);
            alert('수정 실패: ' + err.message);
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!window.confirm('정말로 이 항목을 영구 삭제하시겠습니까? (복구 불가능)')) return;

        const password = prompt('관리자 삭제 비밀번호를 입력하세요:');
        if (password !== '119') {
            alert('비밀번호가 올바르지 않습니다.');
            return;
        }

        try {
            const { error } = await supabase.from('complaints').delete().eq('id', id);
            if (error) throw error;
            alert('영구 삭제되었습니다.');
            // Parent checks prop changes or we could force a refresh, but Realtime might catch it. 
            // Since we rely on props, if Supabase sends a DELETE event, App.jsx updates 'complaints' and we re-render.
        } catch (err) {
            console.error('Delete failed:', err);
            alert('삭제 실패: ' + err.message);
        }
    };

    return (
        <div className="space-y-4 p-4">
            {/* Statistics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">총 접수</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                    <div className="text-red-400 text-xs uppercase font-bold mb-1">로드킬</div>
                    <div className="text-2xl font-bold text-white">{stats.roadkill}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                    <div className="text-orange-400 text-xs uppercase font-bold mb-1">쓰레기</div>
                    <div className="text-2xl font-bold text-white">{stats.trash}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                    <div className="text-yellow-400 text-xs uppercase font-bold mb-1">산불</div>
                    <div className="text-2xl font-bold text-white">{stats.fire}</div>
                </div>
            </div>

            {/* Search Filters */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">카테고리</label>
                    <select
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2 w-32"
                    >
                        <option value="all">전체</option>
                        <option value="roadkill">로드킬</option>
                        <option value="trash">쓰레기투기</option>
                        <option value="fire">산불</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">연도</label>
                    <input
                        type="text"
                        placeholder="YYYY"
                        value={searchYear}
                        onChange={(e) => setSearchYear(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2 w-24"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">날짜</label>
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">주소 검색</label>
                    <input
                        type="text"
                        placeholder="동 이름 검색 (예: 수월동)"
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2 w-full"
                    />
                </div>
                <button
                    onClick={() => {
                        setSearchCategory('all');
                        setSearchYear('');
                        setSearchDate('');
                        setSearchAddress('');
                    }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                >
                    초기화
                </button>
            </div>

            <div className="overflow-x-auto bg-slate-900 rounded-xl border border-white/5">
                <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800 border-b border-white/5">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">년도</th>
                            <th className="px-4 py-3 whitespace-nowrap">날짜</th>
                            <th className="px-4 py-3 whitespace-nowrap">시간</th>
                            <th className="px-4 py-3 whitespace-nowrap">카테고리</th>
                            <th className="px-4 py-3 min-w-[200px]">주소 (수정가능)</th>
                            <th className="px-4 py-3 min-w-[150px]">좌표 (수정가능)</th>
                            <th className="px-4 py-3 whitespace-nowrap">상태</th>
                            <th className="px-4 py-3 whitespace-nowrap">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredComplaints.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-8 text-slate-500">검색 결과가 없습니다.</td>
                            </tr>
                        ) : (
                            filteredComplaints.map((c) => {
                                const dateObj = new Date(c.created_at || c.timestamp);
                                return (
                                    <tr key={c.id} className="border-b border-white/5 hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-3 font-mono">
                                            {dateObj.getFullYear()}
                                        </td>
                                        <td className="px-4 py-3 font-mono">
                                            {dateObj.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\.$/, '')}
                                        </td>
                                        <td className="px-4 py-3 font-mono">
                                            {dateObj.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`
                                            px-2 py-1 rounded text-xs font-bold inline-flex items-center gap-1
                                            ${c.category === 'roadkill' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                    c.category === 'trash' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                                        c.category === 'fire' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-slate-700 text-slate-400'}
                                        `}>
                                                {c.category === 'roadkill' ? '로드킬' :
                                                    c.category === 'trash' ? '쓰레기투기' :
                                                        c.category === 'fire' ? '산불' : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {editingId === c.id ? (
                                                <input
                                                    type="text"
                                                    value={editForm.location}
                                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                    className="bg-slate-900 border border-blue-500 rounded px-2 py-1 text-white w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="truncate max-w-[200px] inline-block" title={c.location}>
                                                    {c.location}
                                                </span>
                                            )}
                                        </td>
                                        /* ... rest of the table body (coords, status, actions) ... */
                                        <td className="px-4 py-3">
                                            {editingId === c.id ? (
                                                <div className="flex gap-1">
                                                    <input
                                                        type="number"
                                                        value={editForm.latitude}
                                                        onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                                                        className="bg-slate-900 border border-blue-500 rounded px-1 py-1 text-white w-20 text-xs"
                                                        step="0.0001"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={editForm.longitude}
                                                        onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                                                        className="bg-slate-900 border border-blue-500 rounded px-1 py-1 text-white w-20 text-xs"
                                                        step="0.0001"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="font-mono text-xs text-slate-500 cursor-help" title="좌표">
                                                    {c.coords ? `${c.coords[1].toFixed(4)}, ${c.coords[0].toFixed(4)}` : '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={c.status || 'none'}
                                                onChange={async (e) => {
                                                    const newStatus = e.target.value;
                                                    try {
                                                        const { error } = await supabase.from('complaints').update({ status: newStatus }).eq('id', c.id);
                                                        if (error) throw error;
                                                    } catch (err) {
                                                        alert('상태 업데이트 실패: ' + err.message);
                                                    }
                                                }}
                                                className={`
                                                text-xs font-bold px-2 py-1 rounded border-none outline-none cursor-pointer appearance-none
                                                ${c.status === 'received' ? 'bg-blue-500/20 text-blue-400' :
                                                        c.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            c.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                                'bg-slate-700 text-slate-400'}
                                            `}
                                            >
                                                <option value="none">대기</option>
                                                <option value="received">접수</option>
                                                <option value="processing">처리중</option>
                                                <option value="completed">완료</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            {editingId === c.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleSave(c.id)} className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-colors">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleEditClick(c)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="수정">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handlePermanentDelete(c.id)} className="p-1 text-red-500 hover:bg-red-500/20 rounded transition-colors" title="영구 삭제 (비밀번호 필요)">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplaintTable;
