import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import HeroBorrowingChart from './HeroBorrowingChart';
import BookProfileModal from '../books/BookProfileModal';
import { getEmptyBookCoverBackground } from '../../utils/bookCoverUtils';

export default function TeacherDashboardMain() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [yearlyStats, setYearlyStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [hasHistory, setHasHistory] = useState(false);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good Morning...', emoji: '🌅' };
    if (hour >= 12 && hour < 17) return { text: 'Good Afternoon...', emoji: '☀️' };
    return { text: 'Good Evening...', emoji: '🌙' };
  };

  const handleYearChange = async (selectedYear) => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/library/quick-lookup/${user._id}?year=${selectedYear}`);
      if (res.data?.yearlyStats) {
        setYearlyStats(res.data.yearlyStats);
      }
    } catch (err) {
      console.error('Error fetching yearly stats for year:', selectedYear, err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [profileRes, recRes] = await Promise.all([
          api.get(`/library/quick-lookup/${user._id}`),
          api.get('/library/recommended-books'),
        ]);
        setData(profileRes.data);
        if (profileRes.data?.yearlyStats) {
          setYearlyStats(profileRes.data.yearlyStats);
        }
        if (recRes.data) {
          setRecommendations(recRes.data.recommendations || []);
          setHasHistory(recRes.data.hasHistory || false);
          setTopCategories(recRes.data.topCategories || []);
        }
      } catch (err) {
        console.error('Error fetching teacher dashboard data:', err);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* 1. Hero Welcome Banner Skeleton */}
        <div
          className="py-2.5 px-4 sm:py-3 sm:px-5 rounded-2xl relative overflow-hidden shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 animate-pulse"
          style={{ background: 'linear-gradient(135deg, #3B0000 0%, #150000 100%)' }}
        >
          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
            <div className="h-7 w-52 rounded-lg bg-white/20" />
            <div className="h-5 w-36 rounded-md bg-white/15" />
            <div className="h-3.5 w-64 rounded bg-white/10 mt-1" />
          </div>
          <div className="w-full md:w-[340px] lg:w-[375px] h-[94px] bg-white/10 rounded-xl border border-white/5" />
        </div>

        {/* 2. Recommended Books Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-4 w-44 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-2 animate-pulse">
                <div className="h-40 rounded-xl bg-slate-200" />
                <div className="h-3 w-4/5 rounded bg-slate-200" />
                <div className="h-2.5 w-1/2 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-600 rounded-2xl p-6 border border-red-100 max-w-lg mx-auto my-10 text-center">
        <span className="material-symbols-outlined mb-2" style={{ fontSize: 36 }}>error</span>
        <h3 className="font-bold text-sm">Dashboard Load Error</h3>
        <p className="text-xs mt-1 text-slate-500">{error || 'Unable to retrieve your borrowing records.'}</p>
      </div>
    );
  }

  const greeting = getGreeting();

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* 1. Dynamic Hero Welcome Banner */}
      <div
        className="py-2.5 px-4 sm:py-3 sm:px-5 rounded-2xl relative overflow-hidden text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3.5"
        style={{ background: 'linear-gradient(135deg, #4C0000 0%, #150000 100%)' }}
      >
        {/* Left: Greetings & Faculty Info */}
        <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
          <div>
            <div className="text-2xl sm:text-3xl lg:text-[30px] font-black text-white tracking-tight leading-tight flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
              <span>{greeting.text}</span>
              <span>{greeting.emoji}</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-[22px] font-extrabold text-white tracking-tight mt-0.5" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {(() => {
                const rawName = user?.name?.trim().split(/\s+/)[0] || 'Teacher';
                return rawName.charAt(0).toUpperCase() + rawName.slice(1);
              })()}
            </div>
          </div>
          <p className="text-xs sm:text-[12px] text-slate-300 mt-1.5 font-medium">
            Welcome back to your Kawudulla MV digital library space.
          </p>
        </div>

        {/* Right: Annual Borrowing Activity Chart */}
        <div className="relative z-10 flex-shrink-0">
          <HeroBorrowingChart
            yearlyStats={yearlyStats || data.yearlyStats}
            onYearChange={handleYearChange}
          />
        </div>
      </div>

      {/* 3. Recommended Books Showcase (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Recommended For You
              </h3>
              <p className="text-[10.5px] text-slate-400 font-medium">
                Curated educational and literature recommendations aligned with your interests
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/books')}
            className="text-xs font-bold text-[#9E0D0D] hover:text-[#7F0A0A] flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl transition-colors border border-slate-200/60"
          >
            Browse Library
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-10 text-center text-slate-400 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined mb-1.5" style={{ fontSize: 32, opacity: 0.3 }}>menu_book</span>
            <p className="text-xs font-semibold text-slate-600">No recommendations available yet</p>
            <p className="text-[10.5px] text-slate-400 mt-0.5">Explore the catalog to discover books you love</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {recommendations.slice(0, 5).map((book) => (
              <div
                key={book._id}
                onClick={() => setSelectedBook(book)}
                className="bg-white hover:bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col group active:scale-[0.98]"
              >
                <div className="w-full aspect-[3/4] rounded-lg bg-slate-100 overflow-hidden mb-2 relative shadow-xs">
                  {book.coverImageUrl ? (
                    <img
                      src={book.coverImageUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white/80 transition-transform duration-300 group-hover:scale-105"
                      style={{ background: getEmptyBookCoverBackground(book) }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 26 }}>menu_book</span>
                    </div>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-[#9E0D0D] transition-colors leading-tight">
                  {book.title}
                </h4>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {book.author}
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[8.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 truncate">
                    {book.category || 'Recommended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Profile Details Modal */}
      <BookProfileModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
