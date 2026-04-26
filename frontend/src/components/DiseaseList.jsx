import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bug, Search, Filter, AlertTriangle, Plus, CheckCircle2, ChevronRight, Calendar, MapPin, User } from 'lucide-react';
import { motion } from 'framer-motion';

const DiseaseList = () => {
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/diseases/full-report');
        setDiseases(res.data);
      } catch (err) {
        setError('Failed to load disease reports. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchDiseases();
  }, []);

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
      default:
        return 'bg-agrigreen-100 text-agrigreen-700 border-agrigreen-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return <AlertTriangle className="w-4 h-4 mr-1" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 mr-1" />;
      case 'low':
      default:
        return <CheckCircle2 className="w-4 h-4 mr-1" />;
    }
  };

  const filteredDiseases = diseases.filter(d => {
    const matchesSearch = 
      d.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.disease_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || d.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
        <p className="text-red-900/60 font-medium animate-pulse">Loading disease records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Crop Diseases Management</h2>
          <p className="text-slate-500 mt-1">Monitor, filter, and track crop infections across all fields.</p>
        </div>
        <button 
          onClick={() => navigate('/disease/new')}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-bold shadow-lg shadow-red-500/30 transform hover:-translate-y-1 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Report Disease
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm animate-in fade-in slide-in-from-top-2 bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-3xl"
      >
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          
          {/* Search Input using Flex wrapper */}
          <div className="flex-1 flex items-center px-4 bg-white/50 border border-slate-200 rounded-xl focus-within:ring-4 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all shadow-sm">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by crop or disease name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3.5 bg-transparent outline-none font-medium text-slate-700 ml-2"
            />
          </div>

          {/* Filter Select using Flex wrapper */}
          <div className="w-full md:w-64 flex items-center px-4 bg-white/50 border border-slate-200 rounded-xl focus-within:ring-4 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all shadow-sm">
            <Filter className="w-5 h-5 text-slate-400 shrink-0" />
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full p-3.5 bg-transparent outline-none font-medium text-slate-700 appearance-none ml-2 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <div className="pointer-events-none shrink-0 ml-1">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          
        </div>

        {filteredDiseases.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold tracking-wide">
                  <th className="p-4 pl-6">Farmer & Field</th>
                  <th className="p-4">Crop & Disease</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Detected On</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredDiseases.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors duration-200 group">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {row.farmer_name}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {row.field_location}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{row.crop_name}</span>
                        <span className="text-sm text-red-600 font-medium flex items-center gap-1 mt-0.5">
                          <Bug className="w-3.5 h-3.5" /> {row.disease_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getSeverityBadge(row.severity)}`}>
                        {getSeverityIcon(row.severity)}
                        {row.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600 font-medium flex items-center gap-1.5 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(row.detection_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 ml-auto font-semibold text-sm group-hover:translate-x-1 duration-300">
                        Details <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Bug className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-medium text-lg">No disease records found.</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search filters or report a new disease.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DiseaseList;
