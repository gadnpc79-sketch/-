
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, User, CheckCircle } from 'lucide-react';

const ReceiverSetup = ({ onComplete }) => {
    const [phone, setPhone] = useState('');
    const [adminId, setAdminId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!phone || !adminId || !category || !name) {
            alert('모든 정보를 입력해주세요.');
            return;
        }

        // Save to localStorage
        const profile = { phone, adminId, category, name };
        localStorage.setItem('suyang_receiver_profile', JSON.stringify(profile));

        onComplete(profile);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900"
        >
            <div className="w-full max-w-md bg-slate-800 rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">관리자 설정</h2>
                    <p className="text-slate-400 text-sm">최초 접속 설정이 필요합니다.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">이름</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="관리자 실명 입력"
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">휴대폰 번호</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="010-0000-0000"
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">관리자 ID</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input
                                type="text"
                                value={adminId}
                                onChange={(e) => setAdminId(e.target.value)}
                                placeholder="사용할 ID를 입력하세요"
                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">수신 카테고리 (담당)</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'roadkill', label: '로드킬', icon: '⚠️' },
                                { id: 'trash', label: '쓰레기투기', icon: '🗑️' },
                                { id: 'fire', label: '산불', icon: '🔥' }
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`
                                        p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all
                                        ${category === cat.id
                                            ? 'bg-blue-600 border-blue-400 text-white'
                                            : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-700'
                                        }
                                    `}
                                >
                                    <span className="text-xl">{cat.icon}</span>
                                    <span className="text-xs font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <CheckCircle size={20} />
                        <span>설정 완료 및 접속</span>
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default ReceiverSetup;
