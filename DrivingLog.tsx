
import React from 'react';
import { CarFront, Plus, MapPin, Navigation, Gauge, ClipboardList, Calendar, Trash2, CheckCircle2, ChevronRight, X, Fuel, ArrowRightLeft, Info, Save, TrendingUp, Settings, BarChart3, Clock, Search, Truck } from 'lucide-react';

interface Vehicle {
  id: string;
  number: string;
  currentMileage: number;
  businessRatio: number;
  purchaseYear: string;
}

interface DrivingEntry {
  id: string;
  date: string;
  vehicleId: string; // 차량 번호 저장
  purpose: string;
  origin: string;
  destination: string;
  startMileage: number;
  endMileage: number;
  totalDistance: number;
  fuelCost: number;
}

const DrivingLog: React.FC = () => {
  const [logs, setLogs] = React.useState<DrivingEntry[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Vehicle Form State
  const [vFormData, setVFormData] = React.useState({
    number: '',
    currentMileage: '',
    businessRatio: '80',
    purchaseYear: new Date().getFullYear().toString()
  });

  // Driving Log Form State
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: '', // 선택된 차량 번호
    purpose: '업무용',
    origin: '',
    destination: '',
    startMileage: 0,
    endMileage: 0,
  });

  React.useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem('qtex_driving_logs') || '[]');
    const savedVehicles = JSON.parse(localStorage.getItem('qtex_vehicles') || '[]');
    setLogs(savedLogs);
    setVehicles(savedVehicles);
    
    if (savedVehicles.length > 0) {
      setFormData(prev => ({ 
        ...prev, 
        vehicleId: savedVehicles[0].number,
        startMileage: savedVehicles[0].currentMileage,
        endMileage: savedVehicles[0].currentMileage
      }));
    }
  }, []);

  // 차량 선택 시 마일리지 동기화
  const handleVehicleSelect = (vNumber: string) => {
    const selected = vehicles.find(v => v.number === vNumber);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        vehicleId: vNumber,
        startMileage: selected.currentMileage,
        endMileage: selected.currentMileage
      }));
    }
  };

  const handleMileageChange = (field: 'startMileage' | 'endMileage', value: string) => {
    const num = Number(value) || 0;
    setFormData(prev => ({ ...prev, [field]: num }));
  };

  const totalDistance = Math.max(0, formData.endMileage - formData.startMileage);
  const estimatedFuelCost = Math.floor(totalDistance * 150);

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vFormData.number) return;

    const newVehicle: Vehicle = {
      id: `VEH-${Date.now()}`,
      number: vFormData.number,
      currentMileage: Number(vFormData.currentMileage) || 0,
      businessRatio: Number(vFormData.businessRatio) || 80,
      purchaseYear: vFormData.purchaseYear
    };

    const updatedVehicles = [...vehicles, newVehicle];
    setVehicles(updatedVehicles);
    localStorage.setItem('qtex_vehicles', JSON.stringify(updatedVehicles));
    
    // 첫 차량 등록 시 폼에 바로 적용
    if (vehicles.length === 0) {
        setFormData(prev => ({ 
            ...prev, 
            vehicleId: newVehicle.number,
            startMileage: newVehicle.currentMileage,
            endMileage: newVehicle.currentMileage
        }));
    }

    setIsVehicleModalOpen(false);
    setVFormData({ number: '', currentMileage: '', businessRatio: '80', purchaseYear: new Date().getFullYear().toString() });
    alert('새 차량이 등록되었습니다.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicleId) {
      alert('차량을 선택해 주세요. 등록된 차량이 없다면 먼저 차량을 등록하세요.');
      return;
    }
    if (totalDistance <= 0) {
      alert('주행 후 거리는 주행 전 거리보다 커야 합니다.');
      return;
    }

    const newEntry: DrivingEntry = {
      id: `DRV-${Date.now()}`,
      date: formData.date,
      vehicleId: formData.vehicleId,
      purpose: formData.purpose,
      origin: formData.origin,
      destination: formData.destination,
      startMileage: formData.startMileage,
      endMileage: formData.endMileage,
      totalDistance: totalDistance,
      fuelCost: estimatedFuelCost
    };

    const updatedLogs = [newEntry, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('qtex_driving_logs', JSON.stringify(updatedLogs));

    // 차량의 현재 주행거리 업데이트
    const updatedVehicles = vehicles.map(v => 
      v.number === formData.vehicleId ? { ...v, currentMileage: formData.endMileage } : v
    );
    setVehicles(updatedVehicles);
    localStorage.setItem('qtex_vehicles', JSON.stringify(updatedVehicles));

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsModalOpen(false);
      setFormData(prev => ({ 
        ...prev, 
        origin: '', 
        destination: '', 
        startMileage: formData.endMileage, 
        endMileage: formData.endMileage 
      }));
    }, 1500);
  };

  const deleteLog = (id: string) => {
    if (confirm('해당 주행 기록을 삭제하시겠습니까?')) {
      const updated = logs.filter(l => l.id !== id);
      setLogs(updated);
      localStorage.setItem('qtex_driving_logs', JSON.stringify(updated));
    }
  };

  const deleteVehicle = (id: string) => {
    if (confirm('해당 차량을 삭제하시겠습니까? 관련 주행 기록은 유지됩니다.')) {
      const updated = vehicles.filter(v => v.id !== id);
      setVehicles(updated);
      localStorage.setItem('qtex_vehicles', JSON.stringify(updated));
    }
  }

  const monthlyTotal = logs.reduce((sum, l) => sum + l.totalDistance, 0);
  const businessRatioDisplay = logs.length > 0 ? (logs.filter(l => l.purpose === '업무용').length / logs.length * 100).toFixed(0) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 lg:pb-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-inner">
            <CarFront size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">업무용 주행일지</h1>
            <p className="text-slate-500 text-sm font-medium">등록 차량 {vehicles.length}대 | 이번 달 {logs.length}건 기록</p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsVehicleModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3.5 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
                <Truck size={20} className="text-blue-500" /> 차량 등록
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
                <Plus size={20} /> 새 주행 기록
            </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">이번 달 누적 거리</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{monthlyTotal.toLocaleString()}</span>
            <span className="text-slate-400 font-bold">km</span>
          </div>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">업무 사용 비율</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{businessRatioDisplay}</span>
            <span className="text-emerald-200 font-bold text-xl">%</span>
          </div>
        </div>
        <div className="bg-slate-900 p-7 rounded-[2.5rem] text-white shadow-xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={80} /></div>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">추정 유류비 절세액</p>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-400">{(monthlyTotal * 150).toLocaleString()}</span>
                <span className="text-slate-500 font-bold text-xl">원</span>
            </div>
        </div>
      </div>

      {/* Vehicles List (Compact) */}
      {vehicles.length > 0 && (
        <section className="space-y-4">
           <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 ml-1">
            <Settings size={18} className="text-slate-400" /> 등록된 차량 관리
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {vehicles.map(v => (
               <div key={v.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><CarFront size={24} /></div>
                    <div>
                      <p className="text-base font-black text-slate-800">{v.number}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase">기초 {v.currentMileage.toLocaleString()}km</span>
                        <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">사업용 {v.businessRatio}%</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteVehicle(v.id)} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
               </div>
             ))}
          </div>
        </section>
      )}

      {/* Log History */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 ml-1">
          <ClipboardList size={18} className="text-slate-400" /> 최근 주행 기록
        </h2>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap border-r border-slate-100">운행일자</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap border-r border-slate-100">차량번호</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">운행구간</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">주행거리</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">목적</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-5 text-xs font-bold text-slate-500 text-center border-r border-slate-100">{log.date}</td>
                      <td className="px-6 py-5 font-black text-slate-700 text-sm text-center border-r border-slate-100">{log.vehicleId}</td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-800">
                          <span className="text-blue-500 truncate max-w-[80px]">{log.origin}</span>
                          <ArrowRightLeft size={12} className="text-slate-300" />
                          <span className="text-emerald-500 truncate max-w-[80px]">{log.destination}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center font-black text-slate-800 text-sm whitespace-nowrap">
                        {log.totalDistance} km
                      </td>
                      <td className="px-8 py-5 text-center whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                          log.purpose === '업무용' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {log.purpose}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <button 
                          onClick={() => deleteLog(log.id)}
                          className="p-2 text-slate-200 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">
                        기록된 주행 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Vehicle Registration Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                     <Truck size={24} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-800">업무용 차량 등록</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Register New Vehicle</p>
                   </div>
                </div>
                <button onClick={() => setIsVehicleModalOpen(false)} className="p-2.5 hover:bg-white bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>
             </div>
             <form onSubmit={handleVehicleSubmit} className="p-10 space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">차량 번호</label>
                  <input type="text" required placeholder="예: 77가 7777" value={vFormData.number} onChange={e => setVFormData({...vFormData, number: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-black text-slate-800" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">현재 주행거리 (km)</label>
                        <input type="number" placeholder="0" value={vFormData.currentMileage} onChange={e => setVFormData({...vFormData, currentMileage: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">구입 연도</label>
                        <input type="number" placeholder="2026" value={vFormData.purchaseYear} onChange={e => setVFormData({...vFormData, purchaseYear: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold text-slate-800" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center mb-2 px-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">사업용 이용 비중</label>
                        <span className="text-sm font-black text-blue-600">{vFormData.businessRatio}%</span>
                    </div>
                    <input type="range" min="1" max="100" value={vFormData.businessRatio} onChange={e => setVFormData({...vFormData, businessRatio: e.target.value})} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                    <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">기본적으로 80%를 권장하며, 운행일지 기록 시 실제 비중이 계산됩니다.</p>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                   차량 등록 완료
                </button>
             </form>
          </div>
        </div>
      )}

      {/* New Log Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {isSuccess ? (
              <div className="p-16 text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-800">작성 완료!</h2>
                <p className="text-slate-500 font-medium">주행 기록이 안전하게 저장되었습니다.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <CarFront size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800">주행 기록 작성</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Driving Entry</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-white bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">운행 일자</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">대상 차량 선택</label>
                      {vehicles.length > 0 ? (
                        <select 
                          value={formData.vehicleId} 
                          onChange={e => handleVehicleSelect(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-black text-slate-800 appearance-none outline-none"
                        >
                          {vehicles.map(v => <option key={v.id} value={v.number}>{v.number}</option>)}
                        </select>
                      ) : (
                        <button type="button" onClick={() => { setIsModalOpen(false); setIsVehicleModalOpen(true); }} className="w-full px-5 py-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black">먼저 차량을 등록하세요</button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">출발지</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
                          <input type="text" placeholder="사업장" required value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">도착지</label>
                        <div className="relative">
                          <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                          <input type="text" placeholder="거래처" required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-bold" />
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">주행 전 (km)</label>
                        <div className="relative">
                          <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input type="number" required value={formData.startMileage} onChange={e => handleMileageChange('startMileage', e.target.value)} className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-black" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">주행 후 (km)</label>
                        <div className="relative">
                          <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                          <input type="number" required value={formData.endMileage} onChange={e => handleMileageChange('endMileage', e.target.value)} className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 text-sm font-black text-blue-600" />
                        </div>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Navigation size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">운행 계산 요약</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-blue-900">{totalDistance}</span>
                                <span className="text-sm font-black text-blue-400">km 주행</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 border-l border-blue-200 pl-6 hidden md:flex">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><Fuel size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">추정 유류비</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-emerald-900">{estimatedFuelCost.toLocaleString()}</span>
                                <span className="text-sm font-black text-emerald-400">원</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">주행 목적</label>
                    <div className="flex gap-2">
                      {['업무용', '비업무용'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({...formData, purpose: p})}
                          className={`flex-1 py-4 rounded-2xl text-xs font-black border-2 transition-all ${
                            formData.purpose === p ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
                    <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                        기록된 데이터는 차량유지비 비용 인정의 근거 자료가 됩니다. 주행 후 거리를 꼼꼼히 입력해 주세요.
                    </p>
                  </div>

                  <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Save size={22} /> 주행 일지 기록 완료
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrivingLog;
