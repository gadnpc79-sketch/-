
import React, { useState } from 'react';
import { Save, Edit2, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ComplaintTable = ({ complaints }) => {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

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

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800 border-b border-slate-700">
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
                    {complaints.map((c) => {
                        const dateObj = new Date(c.created_at || c.timestamp);
                        return (
                            <tr key={c.id} className="border-b border-slate-700 hover:bg-slate-800/50">
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
                                    ${c.category === 'roadkill' ? 'bg-red-500/20 text-red-400' :
                                            c.category === 'trash' ? 'bg-orange-500/20 text-orange-400' :
                                                c.category === 'fire' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}
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
                                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white w-full"
                                        />
                                    ) : (
                                        <span className="truncate max-w-[150px] inline-block" title={c.location}>
                                            {c.location}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {editingId === c.id ? (
                                        <div className="flex gap-1">
                                            <input
                                                type="number"
                                                value={editForm.latitude}
                                                onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                                                className="bg-slate-900 border border-slate-600 rounded px-1 py-1 text-white w-20"
                                                step="0.0001"
                                            />
                                            <input
                                                type="number"
                                                value={editForm.longitude}
                                                onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                                                className="bg-slate-900 border border-slate-600 rounded px-1 py-1 text-white w-20"
                                                step="0.0001"
                                            />
                                        </div>
                                    ) : (
                                        <span className="font-mono text-xs text-slate-500">
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
                                                // Optimistic update or wait for realtime? 
                                                // Since this component receives 'complaints' as prop, we rely on parent's realtime update or we assume parent fetches.
                                                // But for immediate visual feedback if parent doesn't auto-refresh quickly:
                                                // Actually, parent 'ReceiverView' controls 'complaints' state via subscription. It should be fine.
                                            } catch (err) {
                                                alert('상태 업데이트 실패: ' + err.message);
                                            }
                                        }}
                                        className={`
                                        text-xs font-bold px-2 py-1 rounded border-none outline-none cursor-pointer
                                        ${c.status === 'received' ? 'bg-green-500/20 text-green-400' :
                                                c.status === 'dispatched' ? 'bg-blue-500/20 text-blue-400' :
                                                    c.status === 'completed' ? 'bg-slate-500/20 text-slate-400 line-through' :
                                                        'bg-slate-700 text-slate-400'}
                                    `}
                                    >
                                        <option value="none">대기</option>
                                        <option value="received">접수</option>
                                        <option value="dispatched">출동</option>
                                        <option value="completed">완료</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    {editingId === c.id ? (
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleSave(c.id)} className="p-1 text-green-400 hover:bg-green-500/20 rounded">
                                                <Save size={16} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEditClick(c)} className="p-1 text-blue-400 hover:bg-blue-500/20 rounded">
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ComplaintTable;
