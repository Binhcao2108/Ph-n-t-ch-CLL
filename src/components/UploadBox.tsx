import React, { useState, useRef, DragEvent } from 'react';
import { UploadCloud, CheckCircle2, FileSpreadsheet, Trash2, HelpCircle } from 'lucide-react';

interface UploadBoxProps {
  onFilesSelected: (files: { cllFile: File; dhTFile: File; dhPrevFile: File }) => void;
  isProcessing: boolean;
}

export default function UploadBox({ onFilesSelected, isProcessing }: UploadBoxProps) {
  const [cllFile, setCllFile] = useState<File | null>(null);
  const [dhTFile, setDhTFile] = useState<File | null>(null);
  const [dhPrevFile, setDhPrevFile] = useState<File | null>(null);

  const [activeDrag, setActiveDrag] = useState<string | null>(null);

  const cllLnk = useRef<HTMLInputElement>(null);
  const dhTLnk = useRef<HTMLInputElement>(null);
  const dhPrevLnk = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>, slot: string) => {
    e.preventDefault();
    setActiveDrag(slot);
  };

  const handleDragLeave = () => {
    setActiveDrag(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, slot: string) => {
    e.preventDefault();
    setActiveDrag(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        if (slot === 'cll') setCllFile(file);
        if (slot === 'dhT') setDhTFile(file);
        if (slot === 'dhPrev') setDhPrevFile(file);
      } else {
        alert('Vui lòng chỉ tải lên file Excel (.xlsx, .xls)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: string) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (slot === 'cll') setCllFile(file);
      if (slot === 'dhT') setDhTFile(file);
      if (slot === 'dhPrev') setDhPrevFile(file);
    }
  };

  const removeFile = (slot: string) => {
    if (slot === 'cll') setCllFile(null);
    if (slot === 'dhT') setDhTFile(null);
    if (slot === 'dhPrev') setDhPrevFile(null);
  };

  const triggerAnalyze = () => {
    if (cllFile && dhTFile && dhPrevFile) {
      onFilesSelected({
        cllFile,
        dhTFile,
        dhPrevFile
      });
    }
  };

  const isReady = cllFile && dhTFile && dhPrevFile;

  return (
    <div className="bg-white rounded-none border border-slate-900 p-6 md:p-8 shadow-[4px_4px_0px_rgba(15,23,42,0.1)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="text-slate-900 h-5 w-5" />
            Tải lên tài liệu đối chiếu
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Cung cấp đầy đủ 3 tài liệu Excel để hệ thống tự động so sánh, phân tích các chỉ số chất lượng xử lý.
          </p>
        </div>
        
        {/* Dynamic Help tip */}
        <div className="flex items-center gap-2 text-[11px] text-slate-800 bg-slate-50 px-3.5 py-2 rounded-none border border-slate-200 max-w-sm font-mono">
          <HelpCircle className="h-4 w-4 text-slate-600 shrink-0" />
          <span><b>Quy tắc khớp:</b> Đối chiếu Số HĐ &amp; thời gian hoàn tất gần nhất của phiếu CLPS để lấy dữ liệu.</span>
        </div>
      </div>

      {/* Grid of 3 upload zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Slot 1: CLL THÁNG T */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              1. Phiếu CLL Tháng T <span className="text-red-500">*</span>
            </span>
            {cllFile && (
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> OK
              </span>
            )}
          </div>
          
          <input
            type="file"
            ref={cllLnk}
            onChange={(e) => handleFileChange(e, 'cll')}
            className="hidden"
            accept=".xlsx, .xls"
          />

          {!cllFile ? (
            <div
              onDragOver={(e) => handleDragOver(e, 'cll')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'cll')}
              onClick={() => cllLnk.current?.click()}
              className={`flex-1 min-h-[170px] border border-dashed rounded-none flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-100 ${
                activeDrag === 'cll'
                  ? 'border-slate-900 bg-slate-50 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-900 bg-white'
              }`}
            >
              <UploadCloud className="h-7 w-7 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">CLL THÁNG T.xlsx</p>
              <p className="text-[10px] text-slate-400 mt-1 px-4">Kéo thả file hoặc click để duyệt</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[170px] border border-slate-900 bg-white rounded-none p-4 flex flex-col justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.03)]">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-none border border-slate-300">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate" title={cllFile.name}>
                    {cllFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">
                    {(cllFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => removeFile('cll')}
                  className="flex items-center gap-1 text-[10px] text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-none px-2.5 py-1.5 font-bold uppercase tracking-wider transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Xóa file
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Slot 2: ĐÚNG HẸN THÁNG T */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              2. ĐÚNG HẸN THÁNG T <span className="text-red-500">*</span>
            </span>
            {dhTFile && (
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> OK
              </span>
            )}
          </div>
          
          <input
            type="file"
            ref={dhTLnk}
            onChange={(e) => handleFileChange(e, 'dhT')}
            className="hidden"
            accept=".xlsx, .xls"
          />

          {!dhTFile ? (
            <div
              onDragOver={(e) => handleDragOver(e, 'dhT')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'dhT')}
              onClick={() => dhTLnk.current?.click()}
              className={`flex-1 min-h-[170px] border border-dashed rounded-none flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-100 ${
                activeDrag === 'dhT'
                  ? 'border-slate-900 bg-slate-50 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-900 bg-white'
              }`}
            >
              <UploadCloud className="h-7 w-7 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">ĐÚNG HẸN THÁNG T.xlsx</p>
              <p className="text-[10px] text-slate-400 mt-1 px-4">Kéo thả file hoặc click để duyệt</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[170px] border border-slate-900 bg-white rounded-none p-4 flex flex-col justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.03)]">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-none border border-slate-300">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate" title={dhTFile.name}>
                    {dhTFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">
                    {(dhTFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => removeFile('dhT')}
                  className="flex items-center gap-1 text-[10px] text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-none px-2.5 py-1.5 font-bold uppercase tracking-wider transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Xóa file
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Slot 3: ĐÚNG HẸN THÁNG T-1 */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              3. ĐÚNG HẸN THÁNG T-1 <span className="text-red-500">*</span>
            </span>
            {dhPrevFile && (
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> OK
              </span>
            )}
          </div>
          
          <input
            type="file"
            ref={dhPrevLnk}
            onChange={(e) => handleFileChange(e, 'dhPrev')}
            className="hidden"
            accept=".xlsx, .xls"
          />

          {!dhPrevFile ? (
            <div
              onDragOver={(e) => handleDragOver(e, 'dhPrev')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'dhPrev')}
              onClick={() => dhPrevLnk.current?.click()}
              className={`flex-1 min-h-[170px] border border-dashed rounded-none flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-100 ${
                activeDrag === 'dhPrev'
                  ? 'border-slate-900 bg-slate-50 scale-[0.99]'
                  : 'border-slate-300 hover:border-slate-900 bg-white'
              }`}
            >
              <UploadCloud className="h-7 w-7 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">ĐÚNG HẸN THÁNG T-1.xlsx</p>
              <p className="text-[10px] text-slate-400 mt-1 px-4">Kéo thả file hoặc click để duyệt</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[170px] border border-slate-900 bg-white rounded-none p-4 flex flex-col justify-between shadow-[2px_2px_0px_rgba(0,0,0,0.03)]">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-800 rounded-none border border-slate-300">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate" title={dhPrevFile.name}>
                    {dhPrevFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">
                    {(dhPrevFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => removeFile('dhPrev')}
                  className="flex items-center gap-1 text-[10px] text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 rounded-none px-2.5 py-1.5 font-bold uppercase tracking-wider transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Xóa file
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Button controls */}
      <div className="flex flex-col sm:flex-row sm:justify-end items-center gap-4">
        <button
          onClick={triggerAnalyze}
          disabled={!isReady || isProcessing}
          className={`w-full sm:w-auto px-8 py-3.5 text-sm font-bold rounded-none text-center shadow-[2px_2px_0px_rgba(0,0,0,0.15)] transition-all uppercase tracking-widest flex items-center justify-center gap-3 active:translate-y-0.5 ${
            isReady && !isProcessing
              ? 'bg-slate-900 hover:bg-slate-850 text-white cursor-pointer'
              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              {/* Spinning Loader */}
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý dữ liệu...
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" />
              Phân tích dữ liệu
            </>
          )}
        </button>
      </div>
    </div>
  );
}
