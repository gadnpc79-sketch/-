import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Send, MessageSquare, ArrowLeft, RefreshCw, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { checkInBounds, SUYANG_CENTER } from '../utils/geofence';

const SenderView = ({ onBack, onSend, onLocate }) => {
    const [photo, setPhoto] = useState(null);
    const [category, setCategory] = useState(null);
    const [message, setMessage] = useState('');
    const [locationStatus, setLocationStatus] = useState('위치 확인 중...');
    const [coords, setCoords] = useState(null);
    const [isLocating, setIsLocating] = useState(true);
    const [isInArea, setIsInArea] = useState(false);
    const fileInputRef = useRef(null);

    const getLocation = () => {
        setIsLocating(true);
        setLocationStatus('GPS 신호 수신 중...');

        if (!navigator.geolocation) {
            setLocationStatus('GPS를 지원하지 않는 브라우저입니다.');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords([longitude, latitude]);
                setIsInArea(true); // Always allow for now

                // Reverse Geocoding via OSM
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                        { headers: { 'Accept-Language': 'ko' } }
                    );
                    const data = await response.json();
                    if (data && data.display_name) {
                        // Simplify address: remove postal code if possible or just use display_name
                        // display_name is often long. Let's try to construct it from address parts if available.
                        const addr = data.address;
                        const shortAddr = `${addr.province || ''} ${addr.city || addr.county || ''} ${addr.road || ''} ${addr.house_number || ''} ${addr.suburb || ''}`.replace(/\s+/g, ' ').trim();

                        setLocationStatus(shortAddr || data.display_name);
                    } else {
                        setLocationStatus(`위치: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                } catch (e) {
                    console.error('Geocoding error:', e);
                    setLocationStatus(`위치: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                }

                setIsLocating(false);
                if (onLocate) onLocate([longitude, latitude]);
            },
            (error) => {
                console.error(error);
                setLocationStatus('위치 정보를 가져올 수 없습니다. GPS를 켜주세요.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Initial load
    useEffect(() => {
        getLocation();
    }, []);

    const handlePhotoCapture = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!coords && !photo && !message) {
            alert('위치 정보, 사진, 또는 내용 중 하나는 필수입니다.');
            return;
        }

        if (!category) {
            alert('신고 유형(로드킬, 쓰레기투기, 산불)을 선택해주세요.');
            return;
        }

        onSend({
            id: Date.now(),
            type: 'complaint',
            category: category,
            location: locationStatus,
            coords: coords || [128.625, 34.885], // Fallback if GPS fails
            message: message,
            photo: photo,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 pointer-events-none"
        >
            <div className="pointer-events-auto w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        민원 접수
                    </h2>
                    <button onClick={onBack} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
                        <ArrowLeft size={14} /> 취소
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Location Section */}
                    <div className={`rounded-xl p-4 border transition-colors ${isInArea ? 'bg-blue-500/10 border-blue-500/30' :
                        isLocating ? 'bg-slate-800/50 border-white/5' : 'bg-yellow-500/10 border-yellow-500/30'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className={`flex items-center gap-3 font-semibold text-sm ${isInArea ? 'text-blue-400' : isLocating ? 'text-slate-400' : 'text-yellow-400'
                                }`}>
                                <MapPin size={20} />
                                <span>현재 위치</span>
                            </div>
                            <button
                                type="button"
                                onClick={getLocation}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                                title="위치 새로고침"
                            >
                                <RefreshCw size={14} className={isLocating ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <p className="text-slate-200 text-sm font-medium">
                            {locationStatus}
                        </p>
                        {!isLocating && !isInArea && (
                            <p className="text-xs text-yellow-300 mt-2">
                                * 수양동 외부 지역에서도 접수가 가능합니다.
                            </p>
                        )}
                    </div>

                    {/* Camera Section */}

                    {/* Category Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-400">신고 유형 선택 (필수)</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'roadkill', label: '로드킬', icon: '🦌', color: 'bg-red-500/20 border-red-500/50 text-red-400' },
                                { id: 'trash', label: '쓰레기투기', icon: '🗑️', color: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
                                { id: 'fire', label: '산불', icon: '🔥', color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' }
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={`
                                         p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all
                                         ${category === cat.id
                                            ? `${cat.color} ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-500`
                                            : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800'
                                        }
                                     `}
                                >
                                    <span className="text-2xl">{cat.icon}</span>
                                    <span className="text-xs font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-400">사진 첨부</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-full h-48 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors overflow-hidden group"
                        >
                            {photo ? (
                                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="p-3 bg-slate-800 rounded-full group-hover:bg-slate-700 transition-colors">
                                        <Camera size={24} className="text-blue-400" />
                                    </div>
                                    <span className="text-sm text-slate-500">카메라 실행 / 사진 선택</span>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoCapture}
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Message Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-400">요청 사항</label>
                        <div className="relative">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="민원 내용을 입력해주세요..."
                                className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px] resize-none"
                            />
                            <MessageSquare size={16} className="absolute right-4 bottom-4 text-slate-600" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Send size={20} />
                        <span>민원 전송하기</span>
                    </button>
                </form>
            </div>
        </motion.div>
    );
};

export default SenderView;
