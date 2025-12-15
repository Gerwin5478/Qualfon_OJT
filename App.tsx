import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import WikiPage from './components/WikiPage';
import ChatBot from './components/ChatBot';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
        <Sidebar />
        
        <div className="flex-1 flex flex-col ml-64 min-w-0">
          <Header />
          
          <main className="flex-1 overflow-y-auto p-8 scroll-smooth relative">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/policy/:id" element={<WikiPage />} />
            </Routes>
          </main>
        </div>
        
        {/* Floating Chat Bot */}
        <ChatBot />
      </div>
    </Router>
  );
}

export default App;