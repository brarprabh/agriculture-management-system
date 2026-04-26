import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home, Users, Map, TestTube, Droplets, Bug, Sprout } from 'lucide-react';
import Dashboard from './components/Dashboard';
import UserForm from './components/UserForm';
import FieldForm from './components/FieldForm';
import SoilForm from './components/SoilForm';
import FertilizerForm from './components/FertilizerForm';
import DiseaseForm from './components/DiseaseForm';
import DiseaseList from './components/DiseaseList';
import ActivityLogs from './components/ActivityLogs';
import { Activity } from 'lucide-react';

function App() {
  const navItems = [
    { path: "/", name: "Dashboard", icon: Home },
    { path: "/users", name: "Users", icon: Users },
    { path: "/fields", name: "Fields", icon: Map },
    { path: "/soil", name: "Soil Tests", icon: TestTube },
    { path: "/fertilizer", name: "Fertilizers", icon: Droplets },
    { path: "/diseases", name: "Crop Diseases", icon: Bug },
    { path: "/logs", name: "Activity Logs", icon: Activity },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-[#064e3b] text-white flex flex-col shadow-2xl z-10 relative">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-agrigreen-500/20 to-transparent pointer-events-none"></div>
          
          <div className="p-8 pb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-agrigreen-500 to-agrigreen-600 p-2 rounded-xl shadow-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-agrigreen-100">
                AgriManage
              </h1>
            </div>
            <p className="mt-2 text-agrigreen-100/70 text-sm font-medium">Smart Farm System</p>
          </div>
          
          <nav className="flex-1 p-6 space-y-2 mt-4 overflow-y-auto relative z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={item.path}
                  to={item.path} 
                  className={({ isActive }) => `
                    flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-medium
                    ${isActive 
                      ? "bg-gradient-to-r from-agrigreen-500/20 to-agrigreen-500/5 text-white border-l-4 border-agrigreen-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                      : "text-agrigreen-100/70 hover:bg-white/5 hover:text-white hover:translate-x-1 border-l-4 border-transparent"}
                  `}
                >
                  <Icon className="w-5 h-5 opacity-90" /> 
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-6 relative z-10 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-agrigreen-500 to-emerald-400 flex items-center justify-center text-sm font-bold shadow-inner">
                A
              </div>
              <div>
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-xs text-agrigreen-100/60">System Manager</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wMykiLz48L3N2Zz4=')]">
          <div className="p-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<UserForm />} />
              <Route path="/fields" element={<FieldForm />} />
              <Route path="/soil" element={<SoilForm />} />
              <Route path="/fertilizer" element={<FertilizerForm />} />
              <Route path="/diseases" element={<DiseaseList />} />
              <Route path="/disease/new" element={<DiseaseForm />} />
              <Route path="/logs" element={<ActivityLogs />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
