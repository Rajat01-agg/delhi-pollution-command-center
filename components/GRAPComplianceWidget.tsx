import React, { useState } from 'react';
import { 
  AlertOctagon, 
  FileText, 
  Download, 
  Send, 
  Printer, 
  X, 
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Gavel
} from 'lucide-react';
import SocialMediaModal from './SocialMediaModal';

interface GRAPAction {
  id: number;
  title: string;
  description: string;
  targetDepartment: string;
}

interface GRAPStage {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  actions: GRAPAction[];
}

interface GRAPComplianceWidgetProps {
  currentAQI: number;
}

const GRAPComplianceWidget: React.FC<GRAPComplianceWidgetProps> = ({ currentAQI }) => {
  const [selectedAction, setSelectedAction] = useState<GRAPAction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false);

  // Logic to determine stage
  // Thresholds: Stage 4 = AQI > 300 (Severe+), Stage 3 = AQI > 200 (Poor)
  // For demo purposes - can adjust back to 450/300 for production
  const getStage = (): 'STAGE_4' | 'STAGE_3' | 'NORMAL' => {
    if (currentAQI > 300) return 'STAGE_4';
    if (currentAQI > 200) return 'STAGE_3';
    return 'NORMAL';
  };

  const currentStage = getStage();

  if (currentStage === 'NORMAL') return null;

  const STAGE_CONFIG: Record<string, GRAPStage> = {
    STAGE_4: {
      label: 'Stage 4 Activated: Severe+ Emergency',
      color: 'text-red-800',
      bg: 'bg-red-50',
      border: 'border-red-600',
      icon: <AlertOctagon className="h-6 w-6 text-red-600 animate-pulse" />,
      actions: [
        { id: 1, title: 'Ban Diesel Trucks', description: 'Stop entry of heavy goods vehicles into Delhi.', targetDepartment: 'Traffic Police' },
        { id: 2, title: 'Stop Construction', description: 'Halt all linear public projects (C&D activities).', targetDepartment: 'PWD & MCD' },
        { id: 3, title: 'Work From Home', description: 'Implement 50% capacity in government offices.', targetDepartment: 'General Administration' },
        { id: 4, title: 'Close Schools', description: 'Shift classes VI-IX and XI to online mode.', targetDepartment: 'Directorate of Education' }
      ]
    },
    STAGE_3: {
      label: 'Stage 3 Activated: Severe Category',
      color: 'text-orange-800',
      bg: 'bg-orange-50',
      border: 'border-orange-600',
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
      actions: [
        { id: 1, title: 'Ban BS-III Petrol/BS-IV Diesel', description: 'Restrict private vehicles.', targetDepartment: 'Traffic Police' },
        { id: 2, title: 'Intensify Public Transport', description: 'Metro and Bus frequency increase.', targetDepartment: 'DTC & DMRC' },
        { id: 3, title: 'Stop Mining', description: 'Halt stone crushers and mining activities.', targetDepartment: 'Environment Dept' }
      ]
    }
  };

  const config = STAGE_CONFIG[currentStage];

  const handleDraftOrder = (action: GRAPAction) => {
    setIsGenerating(true);
    setSelectedAction(action);
    setTimeout(() => setIsGenerating(false), 800); // Simulate generation delay
  };

  const handlePrint = () => {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedAction) return;

    const orderNumber = `DPCC/GRAP/${currentStage}/2026/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Official Order - ${selectedAction.title}</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .header img { height: 60px; margin-bottom: 15px; }
          .header h1 { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 5px 0; }
          .header h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; color: #555; margin: 3px 0; }
          .header p { font-size: 10pt; color: #666; }
          .order-details { display: flex; justify-content: space-between; font-weight: bold; margin: 20px 0; }
          h3 { text-align: center; font-size: 14pt; text-decoration: underline; margin: 30px 0 20px 0; }
          p { text-align: justify; margin: 15px 0; }
          .directive-box { background: #f5f5f5; border: 1px solid #999; padding: 15px; margin: 20px 0; font-weight: bold; }
          .footer { margin-top: 80px; float: right; text-align: right; }
          .signature { height: 60px; font-family: cursive; font-size: 20pt; color: #1e3a8a; transform: rotate(-10deg); opacity: 0.8; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.03; z-index: -1; }
        </style>
      </head>
      <body>
        <div class="watermark">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_of_India_logo.svg/1200px-Government_of_India_logo.svg.png" width="400" style="filter: grayscale(100%);" />
        </div>
        
        <div class="header">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_of_India_logo.svg/200px-Government_of_India_logo.svg.png" alt="Government Emblem" />
          <h1>Government of NCT of Delhi</h1>
          <h2>Delhi Pollution Control Committee</h2>
          <p>4th Floor, ISBT Building, Kashmere Gate, Delhi - 110006</p>
        </div>

        <div class="order-details">
          <span>Order No: ${orderNumber}</span>
          <span>Date: ${currentDate}</span>
        </div>

        <h3>ORDER</h3>

        <p><strong>Subject:</strong> Immediate implementation of ${currentStage === 'STAGE_4' ? 'Stage-IV' : 'Stage-III'} directions under the Graded Response Action Plan (GRAP) regarding <strong>"${selectedAction.title}"</strong>.</p>

        <p><strong>WHEREAS</strong>, the Air Quality Index (AQI) of Delhi has crossed the threshold of ${currentStage === 'STAGE_4' ? '300 (Severe+)' : '200 (Poor)'}, necessitating immediate emergency measures;</p>

        <p><strong>AND WHEREAS</strong>, the Commission for Air Quality Management (CAQM) has invoked ${currentStage === 'STAGE_4' ? 'Stage-IV' : 'Stage-III'} of GRAP with immediate effect to prevent further deterioration of air quality;</p>

        <p><strong>NOW THEREFORE</strong>, in exercise of the powers conferred under Section 5 of the Environment (Protection) Act, 1986, the following directions are hereby issued for strict compliance by the <strong>${selectedAction.targetDepartment}</strong>:</p>

        <div class="directive-box">
          1. ${selectedAction.title}: ${selectedAction.description}<br/><br/>
          2. Ensure immediate ground-level enforcement and submit a compliance report by 17:00 HRS today.
        </div>

        <p>Non-compliance with this order shall attract penal action under the relevant provisions of the law.</p>

        <div class="footer">
          <div class="signature">Dr. R.K. Singh</div>
          <p style="font-weight: bold; margin: 5px 0;">Member Secretary</p>
          <p style="font-size: 10pt;">Delhi Pollution Control Committee</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Trigger print after content loads
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleIssueOrder = () => {
    if (!selectedAction) return;
    
    setIsIssuing(true);
    
    // Simulate sending order to department
    setTimeout(() => {
      setIsIssuing(false);
      
      // Show Social Media Modal instead of alert
      setShowSocialMediaModal(true);
    }, 2000);
  };

  const handleSocialMediaPublish = async (content: string, platform: 'twitter' | 'whatsapp') => {
    if (!selectedAction) return;

    // Create social media post JSON object
    const socialMediaPost = {
      platform: platform,
      content: platform === 'whatsapp' ? `🚨 *Official VayuSetu Alert:*\n\n${content}` : content,
      timestamp: Date.now(),
      likes: 0,
      shares: 0,
      isAutoGenerated: true,
      action: selectedAction.title,
      department: selectedAction.targetDepartment,
      ...(platform === 'whatsapp' && { broadcastType: 'WhatsApp Channel' }),
    };

    // Send to Firebase/Hostinger Bridge for internal Social Media Feed
    try {
      const SOCIAL_FEED_API = 'https://delhi-citizen-app-default-rtdb.firebaseio.com/social_media_posts.json';
      await fetch(SOCIAL_FEED_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialMediaPost),
      });
      
      console.log(`Successfully posted to ${platform}:`, socialMediaPost);
    } catch (error) {
      console.error('Failed to sync with Firebase:', error);
    }

    // Close modal and reset
    setShowSocialMediaModal(false);
    setSelectedAction(null);
  };

  const handleSocialMediaClose = () => {
    // User chose "No, Internal Only"
    setShowSocialMediaModal(false);
    setSelectedAction(null);
  };

  return (
    <div className={`rounded-xl border-l-4 shadow-sm overflow-hidden mb-6 ${config.bg} ${config.border} border-t border-r border-b border-gray-200`}>
      
      {/* Header Banner */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {config.icon}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${config.color} uppercase tracking-wide flex items-center gap-2`}>
              {config.label}
              <span className="text-xs px-2 py-0.5 bg-white/50 rounded border border-current opacity-75">
                AQI {currentAQI}
              </span>
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Mandatory Graded Response Action Plan (GRAP) measures in effect immediately.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
            <span className="h-2 w-2 bg-red-600 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-red-700 uppercase tracking-widest">Compliance Required</span>
        </div>
      </div>

      {/* Action Checklist */}
      <div className="p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.actions.map((action) => (
            <div key={action.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all group">
              <div className="flex items-start gap-3">
                 <div className="mt-1">
                    <CheckCircle className="h-5 w-5 text-gray-300 group-hover:text-green-500 transition-colors" />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 text-sm">{action.title}</h3>
                    <p className="text-xs text-gray-500">{action.description}</p>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        To: {action.targetDepartment}
                    </span>
                 </div>
              </div>
              <button 
                onClick={() => handleDraftOrder(action)}
                className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wide border border-gray-200 rounded-md transition-colors shadow-sm"
              >
                <Gavel className="h-3 w-3" />
                Draft Order
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Official Order Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-3xl shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Modal Toolbar */}
              <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-300" />
                    <span className="font-semibold text-sm">Official Order Preview</span>
                 </div>
                 <button onClick={() => setSelectedAction(null)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              {/* Document Preview Area (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex justify-center custom-scrollbar">
                  {isGenerating ? (
                      <div className="flex flex-col items-center justify-center h-96">
                          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mb-4"></div>
                          <p className="text-gray-500 font-medium">Generating Government Order...</p>
                      </div>
                  ) : (
                      <div className="bg-white shadow-lg p-12 w-full max-w-[21cm] min-h-[29.7cm] text-gray-900 font-serif relative">
                          {/* Official Header */}
                          <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
                             <div className="flex justify-center mb-4">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_of_India_logo.svg/200px-Government_of_India_logo.svg.png" alt="Emblem" className="h-16 opacity-80" />
                             </div>
                             <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Government of NCT of Delhi</h1>
                             <h2 className="text-sm font-bold uppercase text-gray-600">Delhi Pollution Control Committee</h2>
                             <p className="text-xs text-gray-500 mt-1">4th Floor, ISBT Building, Kashmere Gate, Delhi - 110006</p>
                          </div>

                          {/* Order Body */}
                          <div className="space-y-6 text-sm leading-relaxed text-justify">
                              <div className="flex justify-between font-bold">
                                  <span>Order No: DPCC/GRAP/{currentStage}/2026/{String(Math.floor(Math.random() * 1000)).padStart(3, '0')}</span>
                                  <span>Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                              </div>

                              <h3 className="text-center font-bold text-lg underline decoration-2 underline-offset-4 mt-6">ORDER</h3>

                              <p>
                                  <strong>Subject:</strong> Immediate implementation of {currentStage === 'STAGE_4' ? 'Stage-IV' : 'Stage-III'} directions under the Graded Response Action Plan (GRAP) regarding <strong>"{selectedAction.title}"</strong>.
                              </p>

                              <p>
                                  <strong>WHEREAS</strong>, the Air Quality Index (AQI) of Delhi has crossed the threshold of {currentStage === 'STAGE_4' ? '300 (Severe+)' : '200 (Poor)'}, necessitating immediate emergency measures;
                              </p>

                              <p>
                                  <strong>AND WHEREAS</strong>, the Commission for Air Quality Management (CAQM) has invoked {currentStage === 'STAGE_4' ? 'Stage-IV' : 'Stage-III'} of GRAP with immediate effect to prevent further deterioration of air quality;
                              </p>

                              <p>
                                  <strong>NOW THEREFORE</strong>, in exercise of the powers conferred under Section 5 of the Environment (Protection) Act, 1986, the following directions are hereby issued for strict compliance by the <strong>{selectedAction.targetDepartment}</strong>:
                              </p>

                              <div className="bg-gray-50 border border-gray-200 p-4 my-4 font-bold">
                                  1. {selectedAction.title}: {selectedAction.description} <br/>
                                  2. Ensure immediate ground-level enforcement and submit a compliance report by 17:00 HRS today.
                              </div>

                              <p>
                                  Non-compliance with this order shall attract penal action under the relevant provisions of the law.
                              </p>
                          </div>

                          {/* Footer */}
                          <div className="mt-20 flex flex-col items-end">
                              <div className="h-16 w-32 relative mb-2">
                                  {/* Mock Signature */}
                                  <div className="absolute inset-0 flex items-center justify-center font-script text-2xl text-blue-900 rotate-[-10deg] opacity-80" style={{fontFamily: 'cursive'}}>
                                      Dr. R.K. Singh
                                  </div>
                              </div>
                              <p className="font-bold">Member Secretary</p>
                              <p className="text-xs">Delhi Pollution Control Committee</p>
                          </div>

                          {/* Watermark */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_of_India_logo.svg/1200px-Government_of_India_logo.svg.png" className="w-96 grayscale" />
                          </div>
                      </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0">
                 <button 
                   onClick={() => setSelectedAction(null)}
                   className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                   disabled={isIssuing}
                 >
                    Cancel
                 </button>
                 <button 
                   onClick={handlePrint}
                   disabled={isGenerating || isIssuing}
                   className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Printer className="h-4 w-4" /> Print
                 </button>
                 <button 
                   onClick={handleIssueOrder}
                   disabled={isGenerating || isIssuing}
                   className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isIssuing ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Issuing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Issue Order
                      </>
                    )}
                 </button>
              </div>

           </div>
        </div>
      )}

      {/* Social Media Modal */}
      {showSocialMediaModal && selectedAction && (
        <SocialMediaModal
          isOpen={showSocialMediaModal}
          onClose={handleSocialMediaClose}
          actionTitle={selectedAction.title}
          location="Delhi NCR"
          onPublish={handleSocialMediaPublish}
        />
      )}

    </div>
  );
};

export default GRAPComplianceWidget;
