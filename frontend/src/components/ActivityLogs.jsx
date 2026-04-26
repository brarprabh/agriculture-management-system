import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Clock, Database, Server } from 'lucide-react';
import { motion } from 'framer-motion';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/logs');
        setLogs(res.data);
      } catch (err) {
        setError('Failed to load activity logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-agrigreen-200 border-t-agrigreen-600 rounded-full animate-spin"></div>
        <p className="text-agrigreen-900/60 font-medium animate-pulse">Fetching audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">System Activity Logs</h2>
          <p className="text-slate-500 mt-1">Audit trail of automated database actions and triggers.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-slate-600">
          <Database className="w-4 h-4" />
          PL/SQL Triggers Active
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border flex items-center gap-3 font-medium shadow-sm bg-red-50 text-red-700 border-red-200">
          <Activity className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl"
      >
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Recent Automated Actions</h3>
        </div>

        {logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 p-4 hover:bg-slate-50/80 rounded-xl transition-colors border border-transparent hover:border-slate-100 group">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <Activity className="w-5 h-5" />
                  </div>
                  {i !== logs.length - 1 && (
                    <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex justify-between items-start">
                    <p className="text-slate-800 font-semibold text-lg leading-tight">{log.action}</p>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
                      {log.table_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-400 mt-2">
                    <Clock className="w-4 h-4" />
                    {new Date(log.action_date).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Activity className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-slate-400 font-medium">No activity logs recorded yet.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivityLogs;
