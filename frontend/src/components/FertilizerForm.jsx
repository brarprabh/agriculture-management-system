import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplets, CheckCircle2, AlertCircle } from 'lucide-react';

const FertilizerForm = () => {
  const [formData, setFormData] = useState({ field_id: '', fertilizer_type: '', quantity: '', applied_date: '' });
  const [fields, setFields] = useState([]);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5001/api/fields')
      .then(res => setFields(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMsg('');
    try {
      const res = await axios.post('http://localhost:5001/api/fertilizer', formData);
      setMessage(res.data.message);
      setFormData({ field_id: '', fertilizer_type: '', quantity: '', applied_date: '' });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel p-10 rounded-3xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-lg shadow-teal-500/30 text-white">
          <Droplets className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Log Fertilizer Usage</h2>
      </div>
      
      {message && (
        <div className="mb-8 p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm animate-in fade-in slide-in-from-top-2 bg-agrigreen-50 text-agrigreen-700 border-agrigreen-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {message}
        </div>
      )}
      {errorMsg && (
        <div className="mb-8 p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm animate-in fade-in slide-in-from-top-2 bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMsg}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Target Field</label>
          <select
            required
            className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
            value={formData.field_id}
            onChange={(e) => setFormData({...formData, field_id: e.target.value})}
          >
            <option value="" disabled>Select a field for application...</option>
            {fields.map(f => (
              <option key={f.field_id} value={f.field_id}>{f.location} (ID: {f.field_id})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Fertilizer Type</label>
          <input
            type="text"
            required
            placeholder="e.g., Urea, NPK 15-15-15"
            className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
            value={formData.fertilizer_type}
            onChange={(e) => setFormData({...formData, fertilizer_type: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Quantity (Units)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              placeholder="0.00"
            />
            <p className="text-xs text-orange-600 mt-2 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Note: Cannot exceed 100 units.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Applied Date</label>
            <input
              type="date"
              required
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.applied_date}
              onChange={(e) => setFormData({...formData, applied_date: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-agrigreen-500 to-agrigreen-600 text-white p-4 rounded-xl hover:from-agrigreen-600 hover:to-agrigreen-700 transition-all duration-300 font-bold shadow-lg shadow-agrigreen-500/30 transform hover:-translate-y-1 mt-8 text-lg">
          Log Application
        </button>
      </form>
    </div>
  );
};

export default FertilizerForm;
