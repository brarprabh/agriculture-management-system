import React, { useState } from 'react';
import axios from 'axios';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';

const UserForm = () => {
  const [formData, setFormData] = useState({ name: '', role: 'Farmer', contact: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5001/api/users', formData);
      setMessage(res.data.message);
      setIsError(false);
      setFormData({ name: '', role: 'Farmer', contact: '' });
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
      setIsError(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-panel p-10 rounded-3xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0 w-40 h-40 bg-agrigreen-500/5 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-agrigreen-400 to-agrigreen-600 rounded-xl shadow-lg shadow-agrigreen-500/30 text-white">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Register User</h2>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm animate-in fade-in slide-in-from-top-2 ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-agrigreen-50 text-agrigreen-700 border-agrigreen-200'}`}>
          {isError ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Full Name</label>
          <input
            type="text"
            required
            className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="John Doe"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">System Role</label>
            <select
              className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="Farmer">Farmer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Contact Information</label>
            <input
              type="text"
              required
              className="w-full p-3.5 bg-white/50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-agrigreen-500/20 focus:border-agrigreen-500 transition-all outline-none font-medium text-slate-700 shadow-sm"
              value={formData.contact}
              onChange={(e) => setFormData({...formData, contact: e.target.value})}
              placeholder="Email or Phone number"
            />
          </div>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-agrigreen-500 to-agrigreen-600 text-white p-4 rounded-xl hover:from-agrigreen-600 hover:to-agrigreen-700 transition-all duration-300 font-bold shadow-lg shadow-agrigreen-500/30 transform hover:-translate-y-1 mt-8 text-lg">
          Register New User
        </button>
      </form>
    </div>
  );
};

export default UserForm;
