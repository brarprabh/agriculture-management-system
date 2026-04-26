import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, Beaker, Map as MapIcon, TrendingUp, AlertTriangle, FileText, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [data, setData] = useState({ total_diseases: 0, fertilizer_per_field: [], soil_health: [], alerts: [] });
  const [fieldSummary, setFieldSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, summaryRes] = await Promise.all([
          axios.get('http://localhost:5001/api/dashboard'),
          axios.get('http://localhost:5001/api/reports/field-summary')
        ]);
        setData(dashRes.data);
        setFieldSummary(summaryRes.data);
      } catch (err) {
        setError('Failed to load dashboard data. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-agrigreen-200 border-t-agrigreen-600 rounded-full animate-spin"></div>
        <p className="text-agrigreen-900/60 font-medium animate-pulse">Syncing farm data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto mt-20">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Overview Dashboard</h2>
        <p className="text-slate-500 mt-1">Monitor your farm's health and resource usage in real-time.</p>
      </div>
      
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Metric Card 1 */}
        <motion.div 
          variants={itemVariants} 
          onClick={() => navigate('/diseases')}
          className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-2 hover:scale-[1.02] cursor-pointer shadow-md hover:shadow-red-500/20 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Critical/High Diseases</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-slate-800">{data.total_diseases}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Needs Attention
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl shadow-lg shadow-red-500/30 flex items-center justify-center text-white relative z-10">
              <Activity className="w-7 h-7" />
            </div>
          </div>
        </motion.div>
        
        {/* Metric Card 2 */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-agrigreen-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Monitored Fields</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-slate-800">{data.fertilizer_per_field.length}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-agrigreen-100 text-agrigreen-700 rounded-full">
                  Active
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-agrigreen-400 to-agrigreen-600 rounded-2xl shadow-lg shadow-agrigreen-500/30 flex items-center justify-center text-white relative z-10">
              <MapIcon className="w-7 h-7" />
            </div>
          </div>
        </motion.div>

        {/* Metric Card 3 */}
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Fertilizer</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-slate-800">
                  {data.fertilizer_per_field.reduce((sum, f) => sum + Number(f.total_fertilizer || 0), 0)}
                </h3>
                <span className="text-xs font-medium text-slate-400">Units</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center text-white relative z-10">
              <Beaker className="w-7 h-7" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Alerts Panel Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-panel p-8 rounded-3xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-red-600 flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              System Alerts
            </h3>
            <p className="text-sm text-slate-500 mt-1">Automated alerts from database triggers.</p>
          </div>
        </div>

        {data.alerts && data.alerts.length > 0 ? (
          <div className="space-y-4">
            {data.alerts.map((alert, i) => (
              <div key={i} className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-full mt-1">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-slate-800 font-semibold">{alert.message}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-slate-400 font-medium">No active alerts at this time.</p>
          </div>
        )}
      </motion.div>

      {/* Charts Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="glass-panel p-8 rounded-3xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Activity className="w-5 h-5" />
              </div>
              Soil Nutrients Analysis (N-P-K)
            </h3>
            <p className="text-sm text-slate-500 mt-1">Latest Nitrogen, Phosphorus, and Potassium levels across your fields.</p>
          </div>
        </div>
        
        {data.soil_health && data.soil_health.length > 0 ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.soil_health} margin={{ top: 20, right: 30, left: 15, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="farmer_field" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                  dy={10}
                  label={{ value: 'Farmer & Field Location', position: 'insideBottom', offset: -25, fill: '#475569', fontWeight: 600, fontSize: 14 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 13 }}
                  dx={-10}
                  label={{ value: 'Nutrient Level (mg/kg)', angle: -90, position: 'insideLeft', offset: -5, fill: '#475569', fontWeight: 600, fontSize: 14 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-slate-100">
                          <p className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">📍 {label}</p>
                          <div className="space-y-2">
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center justify-between gap-6 text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                  <span className="text-slate-600 capitalize">{entry.name}:</span>
                                </div>
                                <span className="font-bold text-slate-800">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="nitrogen" name="Nitrogen (N)" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar dataKey="phosphorus" name="Phosphorus (P)" fill="#8b5cf6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar dataKey="potassium" name="Potassium (K)" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-400 font-medium">No recent soil test data available.</p>
          </div>
        )}
      </motion.div>

      {/* Field Summary Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="glass-panel p-8 rounded-3xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              Field Summary Report
            </h3>
            <p className="text-sm text-slate-500 mt-1">Comprehensive breakdown of field resources and incidents.</p>
          </div>
        </div>

        {fieldSummary.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm font-semibold tracking-wide">
                  <th className="p-4 pl-6">Farmer Name</th>
                  <th className="p-4">Field Location</th>
                  <th className="p-4">Total Fertilizer Used</th>
                  <th className="p-4 pr-6">Disease Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {fieldSummary.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors duration-200">
                    <td className="p-4 pl-6 font-medium text-slate-800">
                      {row.farmer_name}
                    </td>
                    <td className="p-4 text-slate-600">
                      {row.field_location}
                    </td>
                    <td className="p-4 font-medium">
                      <span className={`px-3 py-1 rounded-full text-sm ${row.total_fertilizer > 100 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                        {row.total_fertilizer} Units
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${row.disease_count > 0 ? 'bg-red-100 text-red-700' : 'bg-agrigreen-100 text-agrigreen-700'}`}>
                        {row.disease_count > 0 ? (
                          <><AlertTriangle className="w-3.5 h-3.5" /> {row.disease_count} Detected</>
                        ) : (
                          'None'
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-slate-400 font-medium">No data available for the summary report.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
