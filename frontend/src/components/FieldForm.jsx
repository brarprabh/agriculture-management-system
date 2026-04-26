import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Map as MapIcon, CheckCircle2, AlertCircle } from 'lucide-react';

const FieldForm = () => {
  const [formData, setFormData] = useState({ user_id: '', location: '', area_size: '' });
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5001/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/fields', formData);
      setMessage(res.data.message);
      setIsError(false);
      setFormData({ user_id: '', location: '', area_size: '' });
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setIsError(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel p-10 rounded-3xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 text-white">
          <MapIcon className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Add New Field</h2>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm animate-in fade-in slide-in-from-top-2 ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-agrigreen-50 text-agrigreen-700 border-agrigreen-200'}`}>
          {isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Owner (User)</label>
          <select
            required
            className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
            value={formData.user_id}
            onChange={(e) => setFormData({...formData, user_id: e.target.value})}
          >
            <option value="" disabled>Select the field owner...</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Geographical Location</label>
          <input
            type="text"
            required
            className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="e.g., North Block, Valley Farm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Area Size (Acres/Hectares)</label>
          <input
            type="number"
            step="0.01"
            required
            className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
            value={formData.area_size}
            onChange={(e) => setFormData({...formData, area_size: e.target.value})}
            placeholder="0.00"
          />
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-agrigreen-500 to-agrigreen-600 text-white p-4 rounded-xl hover:from-agrigreen-600 hover:to-agrigreen-700 transition-all duration-300 font-bold shadow-lg shadow-agrigreen-500/30 transform hover:-translate-y-1 mt-8 text-lg">
          Add Field
        </button>
      </form>
    </div>
  );
};

export default FieldForm;
