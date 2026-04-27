import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Ruler, Droplets, TestTube, Bug, Bell } from 'lucide-react';

const FarmerFieldDetails = () => {
  const { field_id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFieldData = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/farmer/field/${field_id}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch field details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFieldData();
  }, [field_id]);

  if (loading || !data) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-agrigreen-200 border-t-agrigreen-600 rounded-full animate-spin"></div>
        <p className="text-agrigreen-900/60 font-medium">Loading field records...</p>
      </div>
    );
  }

  const { field, fertilizers, soil, diseases, alerts } = data;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Link to="/farmer-dashboard" className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight capitalize">{field?.location} Farm</h2>
          <p className="text-slate-500 mt-1 flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> Field #{field?.field_id}</span>
            <span className="flex items-center gap-1"><Ruler className="w-4 h-4"/> {field?.area_size} Acres</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" /> Field Alerts
          </h3>
          <div className="space-y-3">
            {alerts && alerts.length > 0 ? alerts.map((a, i) => (
              <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-slate-800 font-medium">{a.message}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(a.created_at).toLocaleString()}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No alerts for this field.</p>
            )}
          </div>
        </motion.div>

        {/* Soil Reports */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5 text-purple-500" /> Soil Reports
          </h3>
          <div className="space-y-3">
            {soil && soil.length > 0 ? soil.map((s, i) => {
              const isAcidic = parseFloat(s.pH) < 6;
              return (
                <div key={i} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-700">pH Level: <span className={isAcidic ? 'text-orange-500' : 'text-emerald-600'}>{s.pH}</span></p>
                    <p className="text-xs text-slate-500 mt-1">N: {s.nitrogen} | P: {s.phosphorus} | K: {s.potassium}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">
                    {new Date(s.test_date).toLocaleDateString()}
                  </span>
                </div>
              )
            }) : (
              <p className="text-sm text-slate-500 italic">No soil tests recorded.</p>
            )}
          </div>
        </motion.div>

        {/* Fertilizer History */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" /> Fertilizer Usage
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {fertilizers && fertilizers.length > 0 ? fertilizers.map((f, i) => (
              <div key={i} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center bg-white hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-700 capitalize">{f.fertilizer_type}</p>
                  <p className="text-xs text-blue-600 font-medium">{f.quantity} Units</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(f.applied_date).toLocaleDateString()}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No fertilizer recorded.</p>
            )}
          </div>
        </motion.div>

        {/* Disease Records */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-500" /> Disease History
          </h3>
          <div className="space-y-3">
            {diseases && diseases.length > 0 ? diseases.map((d, i) => (
              <div key={i} className="p-3 bg-white border border-slate-100 rounded-xl">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-bold text-slate-800 capitalize">{d.disease_name} <span className="text-slate-400 text-xs font-normal">on {d.crop_name}</span></p>
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                    d.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                    d.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {d.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-right">Detected: {new Date(d.detection_date).toLocaleDateString()}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No diseases reported!</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FarmerFieldDetails;
