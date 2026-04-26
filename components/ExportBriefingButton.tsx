import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2 } from 'lucide-react';
import { PriorityWard } from '../types';

interface ExportBriefingButtonProps {
  currentAQI: number;
  criticalWards: PriorityWard[];
  actionsTakenCount: number;
}

const ExportBriefingButton: React.FC<ExportBriefingButtonProps> = ({ 
  currentAQI, 
  criticalWards, 
  actionsTakenCount 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
  };

  // Only trigger print once the content is mounted
  useEffect(() => {
    if (isGenerating) {
      // Small delay to ensure images start loading and DOM is painted
      const timer = setTimeout(() => {
        window.print();
        // Reset state after print dialog closes to clean up DOM
        setIsGenerating(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGenerating]);

  const getStatusText = (aqi: number) => {
    if (aqi > 400) return 'SEVERE';
    if (aqi > 300) return 'VERY POOR';
    return 'POOR';
  };

  const topWards = [...criticalWards]
    .sort((a, b) => b.currentAQI - a.currentAQI)
    .slice(0, 3);

  // Portal Content - Only exists when isGenerating is true
  const printContent = (
    <div id="cm-briefing-report" className="hidden print:block">
      <style>{`
        @media print {
          /* Hide all immediate children of body */
          body > * {
            display: none !important;
          }
          /* Explicitly show our report container */
          body > #cm-briefing-report {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 2cm;
            background: white;
            z-index: 99999;
          }
          
          @page { size: A4; margin: 0; }
          
          /* Reset basics for print */
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          /* Restore text colors */
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color: black !important;
            font-family: 'Times New Roman', serif !important;
          }
        }
      `}</style>

      <div className="bg-white text-black font-serif w-full h-full">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
          <div className="w-20">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/1200px-Emblem_of_India.svg.png" alt="Emblem" className="w-16 grayscale" loading="eager" />
          </div>
          <div className="text-center flex-1 pt-2">
            <h1 className="text-xl font-bold uppercase tracking-widest leading-tight">Government of NCT of Delhi</h1>
            <h2 className="text-lg font-bold uppercase mt-1">Delhi Pollution Control Committee</h2>
            <p className="text-xs mt-1">4th Floor, ISBT Building, Kashmere Gate, Delhi - 110006</p>
          </div>
          <div className="w-20 flex justify-end">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/G20_India_2023_logo.svg/1200px-G20_India_2023_logo.svg.png" alt="G20" className="w-20 grayscale opacity-80" loading="eager" />
          </div>
        </div>

        {/* MEMO META */}
        <div className="mb-8 text-sm">
          <div className="flex justify-between items-end mb-4">
            <div className="space-y-1">
              <p><strong>To:</strong> The Hon'ble Chief Minister, Govt of NCT of Delhi</p>
              <p><strong>From:</strong> Central Command Center (CCC)</p>
              <p><strong>Ref No:</strong> DPCC/SITREP/{new Date().getFullYear()}/{Math.floor(Math.random() * 1000)}</p>
            </div>
            <div className="text-right space-y-1">
              <p><strong>Date:</strong> {currentDate}</p>
              <p><strong>Time:</strong> {currentTime}</p>
              <p><strong>Severity:</strong> <span className="border border-black px-1 font-bold">{getStatusText(currentAQI)}</span></p>
            </div>
          </div>
          <div className="text-center py-2 bg-gray-200 border-y border-black font-bold uppercase tracking-wide">
            Subject: SITUATION REPORT: Daily Air Quality & Action Taken
          </div>
        </div>

        {/* SECTION 1 */}
        <div className="mb-8">
          <h3 className="font-bold border-b border-black inline-block mb-3 uppercase text-sm">1. Executive Summary</h3>
          <p className="text-justify leading-relaxed text-sm">
            The average Air Quality Index (AQI) for Delhi today stands at <strong>{currentAQI}</strong>, categorizing the air quality as <strong>{getStatusText(currentAQI)}</strong>. 
            Meteorological conditions indicate stable winds contributing to pollutant accumulation. 
            The Central Command Center has recorded <strong>{criticalWards.filter(w => w.urgency === 'critical').length} critical hotspots</strong> requiring immediate intervention. 
            GRAP Stage-{currentAQI > 450 ? 'IV' : 'III'} measures are currently in force.
          </p>
        </div>

        {/* SECTION 2 */}
        <div className="mb-8">
          <h3 className="font-bold border-b border-black inline-block mb-3 uppercase text-sm">2. Critical Pollution Hotspots (Top 3)</h3>
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">Ward Name</th>
                <th className="border border-black p-2 text-left">Zone</th>
                <th className="border border-black p-2 text-center">Current AQI</th>
                <th className="border border-black p-2 text-left">Primary Pollutant Source</th>
              </tr>
            </thead>
            <tbody>
              {topWards.map((ward) => (
                <tr key={ward.id}>
                  <td className="border border-black p-2 font-bold">{ward.name}</td>
                  <td className="border border-black p-2">{ward.zone}</td>
                  <td className="border border-black p-2 text-center font-bold">{ward.currentAQI}</td>
                  <td className="border border-black p-2">{ward.primarySource}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 3 */}
        <div className="mb-12">
          <h3 className="font-bold border-b border-black inline-block mb-3 uppercase text-sm">3. Action Taken Report (24 Hrs)</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="border border-black p-4">
              <p className="text-xs uppercase text-gray-600 mb-1">Total Interventions Deployed</p>
              <p className="text-2xl font-bold">{actionsTakenCount}</p>
            </div>
            <div className="border border-black p-4">
              <p className="text-xs uppercase text-gray-600 mb-1">Est. Funds Utilized Today</p>
              <p className="text-2xl font-bold">₹ 2,45,000</p>
            </div>
          </div>
          <div className="text-sm">
            <p className="mb-1 font-bold">Key Measures Enforced:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Mechanical road sweeping initialized in all severe wards.</li>
              <li>Anti-smog guns deployed at 12 major construction sites.</li>
              <li>Traffic police teams deployed at 24 congestion points to reduce idling.</li>
              {currentAQI > 400 && <li>Construction activities halted (GRAP-4 Compliance).</li>}
            </ul>
          </div>
        </div>

        {/* FOOTER */}
        <div className="fixed bottom-0 left-0 w-full text-center text-[10px] text-gray-500 border-t border-gray-300 pt-2 bg-white pb-4">
          <p>Generated by GeoVision SAKSHAM System | CONFIDENTIAL DOCUMENT | Not for Public Distribution</p>
          <p>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} | Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button 
        type="button"
        onClick={handlePrint}
        disabled={isGenerating}
        className={`relative z-30 px-4 py-2 rounded-lg 
                   flex items-center gap-2 text-sm font-medium transition-colors shadow-sm ml-2 
                   ${isGenerating 
                     ? 'bg-gray-700 text-gray-300 cursor-wait' 
                     : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95 cursor-pointer'}`}
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        {isGenerating ? 'Generating...' : 'Export CM Briefing'}
      </button>
      
      {/* Conditionally render portal only when generating - prevents DOM bloat on initial load */}
      {isGenerating && createPortal(printContent, document.body)}
    </>
  );
};

export default ExportBriefingButton;