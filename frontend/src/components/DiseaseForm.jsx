import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bug, CheckCircle2, AlertCircle } from 'lucide-react';

const DiseaseForm = () => {
  const [formData, setFormData] = useState({ field_id: '', crop_name: '', disease_name: '', severity: 'Low', detection_date: '' });
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
      const res = await axios.post('http://localhost:5001/api/disease', formData);
      setMessage(res.data.message);
      setIsError(false);
      setFormData({ field_id: '', crop_name: '', disease_name: '', severity: 'Low', detection_date: '' });
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setIsError(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel p-10 rounded-3xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg shadow-red-500/30 text-white">
          <Bug className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Report Crop Disease</h2>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm animate-in fade-in slide-in-from-top-2 ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-agrigreen-50 text-agrigreen-700 border-agrigreen-200'}`}>
          {isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Affected Field</label>
          <select
            required
            className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
            value={formData.field_id}
            onChange={(e) => setFormData({...formData, field_id: e.target.value})}
          >
            <option value="" disabled>Select the affected field...</option>
            {fields.map(f => (
              <option key={f.field_id} value={f.field_id}>{f.location} (ID: {f.field_id})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Crop Name</label>
            <input
              type="text"
              required
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.crop_name}
              onChange={(e) => setFormData({...formData, crop_name: e.target.value})}
              placeholder="e.g., Wheat, Corn"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Disease Name</label>
            <input
              type="text"
              required
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.disease_name}
              onChange={(e) => setFormData({...formData, disease_name: e.target.value})}
              placeholder="e.g., Leaf Rust"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Severity Level</label>
            <select
              required
              className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.severity}
              onChange={(e) => setFormData({...formData, severity: e.target.value})}
            >
              <option value="Low">Low - Monitored</option>
              <option value="Medium">Medium - Treatable</option>
              <option value="High">High - Widespread</option>
              <option value="Critical">Critical - Immediate Action</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Detection Date</label>
            <input
              type="date"
              required
              className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.detection_date}
              onChange={(e) => setFormData({...formData, detection_date: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-bold shadow-lg shadow-red-500/30 transform hover:-translate-y-1 mt-8 text-lg">
          Report Disease Instance
        </button>
      </form>
    </div>
  );
};

export default DiseaseForm;
