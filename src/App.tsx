import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="flex">
      <div className="h-screen bg-gradient-to-r from-blue-200 to-purple-900 w-screen">
        <div className="w-1/4 rounded-lg shadow-lg p-4 bg-black bg-opacity-75 border-b-4 border-r-4 border-black text-white ml-8 mt-8">
          <h3 className="font-semibold text-2xl tracking-wide ">{'>'} Andreas Jilvero AB</h3>
          <p className="text-2xl">{'>'} Västmannagatan 44</p>
          <p className="text-2xl">{'>'} 113 25 Stockholm</p>
        </div>
      </div>
    </div>
  );
}

export default App;
