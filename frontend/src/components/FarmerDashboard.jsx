import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MapIcon, Droplets, Bug, TestTube, ChevronRight, Activity } from 'lucide-react';

const FarmerDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, fieldsRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/farmer/dashboard/${user.farmer_id || user.user_id}`),
          axios.get(`http://localhost:5001/api/farmer/fields/${user.farmer_id || user.user_id}`)
        ]);
        setStats(dashboardRes.data);
        setFields(fieldsRes.data);
      } catch (error) {
        console.error("Error fetching farmer data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-agrigreen-200 border-t-agrigreen-600 rounded-full animate-spin"></div>
        <p className="text-agrigreen-900/60 font-medium">Loading your portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Welcome, {user.name}</h2>
          <p className="text-slate-500 mt-1">Here is the overview of your farms.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Fields" value={stats.field_count} icon={<MapIcon />} color="blue" />
        <StatCard title="Total Fertilizer" value={`${stats.total_fertilizer} Units`} icon={<Droplets />} color="emerald" />
        <StatCard 
          title="Critical Diseases" 
          value={stats.disease_count} 
          icon={<Bug />} 
          color={stats.disease_count > 0 ? "red" : "slate"} 
          subtitle={stats.disease_count > 0 ? "Inspect crops urgently!" : "All clear"}
        />
        <StatCard title="Soil Reports" value={stats.soil_count} icon={<TestTube />} color="purple" />
      </div>

      {/* Fields List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl"
      >
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-agrigreen-600" />
          My Farm Locations
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {fields.map(field => {
            const isAcidic = parseFloat(field.latest_ph) < 6.0;
            return (
              <Link to={`/farmer/field/${field.field_id}`} key={field.field_id} className="block group">
                <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-xl hover:border-agrigreen-300 transition-all bg-white relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800 capitalize">{field.location}</h4>
                      <p className="text-sm text-slate-500">{field.area_size} Acres</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-agrigreen-50 group-hover:text-agrigreen-600 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Fertilizer</p>
                      <p className="text-sm font-bold text-slate-700">{field.total_fertilizer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Diseases</p>
                      <p className={`text-sm font-bold ${field.disease_count > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {field.disease_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Soil pH</p>
                      <p className={`text-sm font-bold ${isAcidic ? 'text-orange-500' : 'text-emerald-600'}`}>
                        {field.latest_ph ? field.latest_ph : 'N/A'}
                        {isAcidic && <span className="block text-[10px] text-orange-500 font-normal">Acidic</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
          {fields.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-500 font-medium">You don't have any fields assigned to you yet.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, subtitle }) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-panel p-6 rounded-3xl relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${colorMap[color].replace('text-', 'bg-').replace('50', '500')}/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
      <div className="flex flex-col h-full justify-between">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className="mt-4">
          <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            {value}
          </h3>
          {subtitle && (
            <p className={`text-xs font-bold mt-2 ${color === 'red' ? 'text-red-500' : 'text-emerald-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`mt-4 w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
};

export default FarmerDashboard;
