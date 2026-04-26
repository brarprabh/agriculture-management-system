import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TestTube, CheckCircle2, AlertCircle } from 'lucide-react';

const SoilForm = () => {
  const [formData, setFormData] = useState({ field_id: '', pH: '', nitrogen: '', phosphorus: '', potassium: '', test_date: '' });
  const [fields, setFields] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5001/api/fields')
      .then(res => setFields(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/soil', formData);
      setMessage(res.data.message);
      setIsError(false);
      setFormData({ field_id: '', pH: '', nitrogen: '', phosphorus: '', potassium: '', test_date: '' });
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setIsError(true);
    }
  };

  return (
    <div className="max-w-3xl mx-auto glass-panel p-10 rounded-3xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 text-white">
          <TestTube className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Record Soil Properties</h2>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm animate-in fade-in slide-in-from-top-2 ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-agrigreen-50 text-agrigreen-700 border-agrigreen-200'}`}>
          {isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {message}
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
            <option value="" disabled>Select a field for the test...</option>
            {fields.map(f => (
              <option key={f.field_id} value={f.field_id}>{f.location} (ID: {f.field_id})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">pH Level</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.pH}
              onChange={(e) => setFormData({...formData, pH: e.target.value})}
              placeholder="0.0 - 14.0"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Test Date</label>
            <input
              type="date"
              required
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.test_date}
              onChange={(e) => setFormData({...formData, test_date: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Nitrogen (N)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.nitrogen}
              onChange={(e) => setFormData({...formData, nitrogen: e.target.value})}
              placeholder="mg/kg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Phosphorus (P)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.phosphorus}
              onChange={(e) => setFormData({...formData, phosphorus: e.target.value})}
              placeholder="mg/kg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Potassium (K)</label>
            <input
              type="number"
              step="0.01"
              required
              className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.potassium}
              onChange={(e) => setFormData({...formData, potassium: e.target.value})}
              placeholder="mg/kg"
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-agrigreen-500 to-agrigreen-600 text-white p-4 rounded-xl hover:from-agrigreen-600 hover:to-agrigreen-700 transition-all duration-300 font-bold shadow-lg shadow-agrigreen-500/30 transform hover:-translate-y-1 mt-8 text-lg">
          Save Soil Analysis
        </button>
      </form>
    </div>
  );
};

export default SoilForm;
