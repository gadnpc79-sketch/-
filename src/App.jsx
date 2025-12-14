import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Send, Users } from 'lucide-react';
import MapBackground from './components/MapBackground';
import SenderView from './components/SenderView';
import ReceiverView from './components/ReceiverView';
import ReceiverSetup from './components/ReceiverSetup';
import { playNotificationSound } from './utils/sound';
import { supabase } from './supabaseClient';

function App() {
  const [mode, setMode] = useState('landing'); // landing, sender, receiver
  const [complaints, setComplaints] = useState([]);
  const [viewCoords, setViewCoords] = useState(null);

  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('suyang_admin_auth') === 'true');
  const [receiverProfile, setReceiverProfile] = useState(() => {
    const saved = localStorage.getItem('suyang_receiver_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Supabase Integration - Only for Admins
  useEffect(() => {
    if (!isAdmin) {
      setComplaints([]);
      return;
    }

    // 1. Check for valid configuration
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url || url.includes('your-project')) {
      console.warn('Supabase not configured');
      // We rely on the error handling in handleSend to notify user when they try to use it
    }

    // Define fetch function
    const fetchComplaints = async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching complaints:', error);
      } else {
        // Filter based on category if profile exists
        const filtered = receiverProfile
          ? (data || []).filter(c => {
            // Support both old (single category) and new (categories array) formats
            if (receiverProfile.categories && Array.isArray(receiverProfile.categories)) {
              return receiverProfile.categories.includes(c.category);
            }
            return c.category === receiverProfile.category;
          })
          : (data || []);
        setComplaints(filtered);
      }
    };

    // Initial fetch
    fetchComplaints();

    // 2. Subscribe to real-time changes
    const channel = supabase
      .channel('public:complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, (payload) => {
        // Refetch to ensure consistency and correct data types
        console.log('Realtime update received:', payload);
        fetchComplaints();
        if (payload.eventType === 'INSERT') {
          playNotificationSound();
        }
      })
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, receiverProfile]); // Re-subscribe if profile changes

  const handleAdminEntry = () => {
    // 1. Check password first
    if (!isAdmin) {
      const password = prompt('관리자 암호를 입력하세요:');
      if (password !== '639') {
        if (password !== null) alert('암호가 올바르지 않습니다.');
        return;
      }
      localStorage.setItem('suyang_admin_auth', 'true');
      setIsAdmin(true);
    }

    // 2. Check setup
    if (!receiverProfile) {
      setMode('receiver_setup');
    } else {
      setMode('receiver');
    }
  };

  const handleSetupComplete = (profile) => {
    setReceiverProfile(profile);
    setMode('receiver');
  };

  const handleDelete = async (ids) => {
    if (!ids || ids.length === 0) return;

    if (!window.confirm(`${ids.length}개의 항목을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('complaints')
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Realtime subscription will handle the UI update (fetchComplaints)
      alert('삭제되었습니다.');
    } catch (err) {
      console.error('Error deleting:', err);
      alert('삭제 실패: ' + err.message);
    }
  };


  const handleSend = async (data) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      alert('오류: Supabase 연결 설정이 되어있지 않습니다. Vercel 환경변수를 확인해주세요.');
      // Local fallback for demo
      setComplaints(prev => [data, ...prev]);
      setMode('landing');
      return;
    }

    // Optimistic update (optional, but let's wait for server for reliability or just do it)
    // Actually, with real-time, we'll get the echo back. But for UI responsiveness:
    // setComplaints(prev => [data, ...prev]); 
    // ^ No, let's rely on the subscription to avoid duplicates or need to dedup.

    // Upload to Supabase
    // We map our frontend object to DB columns. 
    // Assuming DB columns: id (auto), message, location, coords, photo, created_at
    // But safely, we can just pass the whole object if columns match.
    // We'll rename 'timestamp' to 'created_at' if standard, or just keep 'timestamp'.
    // Let's use the data object as is, assuming table matches.

    try {
      const { error } = await supabase
        .from('complaints')
        .insert([{
          message: data.message,
          location: data.location,
          coords: data.coords,
          photo: data.photo, // Note: storing base64 in DB is bad practice for prod (size limits), but fine for MVP demo.
          created_at: data.timestamp
          // id is usually auto-generated by DB, so we might omit it or let DB handle it.
          // data.id was Date.now(), we can use it or let DB override.
        }]);

      if (error) throw error;

      setMode('landing');
      alert('민원이 성공적으로 접수되었습니다! (전체 공유)');
    } catch (err) {
      console.error('Error sending complaint:', err);

      let errorMsg = '송신 실패 (DB 연결 확인 필요).';
      if (err.message && err.message.includes('row-level security')) {
        errorMsg = '송신 실패: 권한이 없습니다. Supabase RLS 정책을 확인해주세요.';
      } else if (err.message) {
        errorMsg = `송신 실패: ${err.message}`;
      }

      alert(errorMsg);
      // Fallback for demo if no DB connection
      // Local fallback
      setComplaints(prev => [data, ...prev]);
      setMode('landing');
    }
  };

  const handleBroadcast = (ids) => {
    alert(`${ids.length}명에게 신 자료가 전송되었습니다.`);
    setMode('landing');
  };

  const handleLocateSender = (coords) => {
    setViewCoords(coords);
    // Also set this as "myCoords" to show the blue dot
    // If we are in sender mode, this represents "Me".
  }

  return (
    <div className="relative w-full h-full overflow-hidden font-sans">
      {/* Background Map - Persistent */}
      <MapBackground markers={complaints} viewCoords={viewCoords} myCoords={viewCoords} />

      {/* Main Content Overlay */}
      <AnimatePresence mode="wait">

        {/* Landing Page */}
        {mode === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="glass-dark p-8 rounded-3xl max-w-sm w-full shadow-2xl border border-white/10 backdrop-blur-md">
              <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                수양동 안전 알림
              </h1>
              <p className="text-xl font-bold text-white mb-2">제작자 : 안동남</p>
              <p className="text-slate-400 mb-8 text-sm">
                스마트 위치 기반 민원 송수신 시스템
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => setMode('sender')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
                >
                  <Send size={24} />
                  <span>민원 접수 (보내기)</span>
                </button>

                <button
                  onClick={handleAdminEntry}
                  className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all text-slate-200 font-semibold py-4 rounded-xl flex items-center justify-center gap-3 backdrop-blur-sm"
                >
                  <Users size={24} />
                  <span>관리자 / 수신 모드</span>
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Shield size={12} />
                <span>거제시 수양동 3D 지도 시스템</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sender View */}
        {mode === 'sender' && (
          <SenderView
            key="sender"
            onBack={() => setMode('landing')}
            onSend={handleSend}
            onLocate={handleLocateSender}
          />
        )}

        {/* Receiver Setup */}
        {mode === 'receiver_setup' && (
          <ReceiverSetup
            onComplete={handleSetupComplete}
          />
        )}

        {/* Receiver View */}
        {mode === 'receiver' && (
          <ReceiverView
            key="receiver"
            complaints={complaints}
            profile={receiverProfile}
            onBack={() => setMode('landing')}
            onBroadcast={handleBroadcast}
            onDelete={handleDelete}
          />
        )}

      </AnimatePresence>
    </div>
  );
}

export default App;
