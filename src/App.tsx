import React, { useState } from 'react';
import { Printer, Plus, Trash2, Image as ImageIcon, Settings, X, FileDown, FileText, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, ImageRun } from 'docx';
import { saveAs } from 'file-saver';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  phone1: string;
  phone2: string;
  items: InvoiceItem[];
  shippingCost: number;
  deposit: number;
  logoUrl: string;
  companyName: string;
  companySubtitle: string;
  footerText: string;
  signatureText: string;
}

export default function App() {
  const [data, setData] = useState<InvoiceData>({
    invoiceNumber: 'AR-210',
    date: '02-02-2026',
    customerName: 'اسلام محمد عبدالقادر',
    customerAddress: 'الكيلو 21 اسكندريه',
    phone1: '01096778622',
    phone2: '01228217878',
    items: [
      { id: '1', name: 'توينز تريكومستورد', quantity: 1, price: 650 }
    ],
    shippingCost: 0,
    deposit: 0,
    logoUrl: '',
    companyName: 'Mr & Mrs Fashion',
    companySubtitle: 'لأرقى الموديلات والأزياء الحديثة',
    footerText: 'Mr & Mrs Fashion',
    signatureText: 'إمضاء الاستلام'
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  const calculateSubtotal = () => {
    return data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + data.shippingCost;
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 3, // High quality
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${data.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadWord = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    
    setIsGeneratingWord(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, // 2 is enough for Word, keeps file size reasonable
        useCORS: true,
        logging: false
      });
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not generate image blob');
      
      const arrayBuffer = await blob.arrayBuffer();
      
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 0, right: 0, bottom: 0, left: 0 },
            },
          },
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: arrayBuffer,
                  transformation: {
                    width: 794, // A4 width in px at 96dpi
                    height: 1123, // A4 height in px at 96dpi
                  },
                }),
              ],
            }),
          ],
        }],
      });
      
      const docxBlob = await Packer.toBlob(doc);
      saveAs(docxBlob, `Invoice_${data.invoiceNumber}.docx`);
    } catch (error) {
      console.error('Error generating Word document:', error);
      alert('حدث خطأ أثناء إنشاء ملف Word');
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({ ...data, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setData({
      ...data,
      items: [...data.items, { id: Date.now().toString(), name: '', quantity: 1, price: 0 }]
    });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setData({
      ...data,
      items: data.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const removeItem = (id: string) => {
    setData({
      ...data,
      items: data.items.filter(item => item.id !== id)
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans" dir="rtl">
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 no-print p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">إعدادات الفاتورة الأساسية</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">شعار الشركة</label>
                <div className="flex items-center gap-4">
                  {data.logoUrl && (
                    <img src={data.logoUrl} alt="Logo preview" className="w-12 h-12 rounded object-contain border" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-[#3b3b98] hover:file:bg-indigo-100 cursor-pointer" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">اسم الشركة / المتجر</label>
                <input type="text" value={data.companyName} onChange={e => setData({...data, companyName: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الوصف أسفل الاسم</label>
                <input type="text" value={data.companySubtitle} onChange={e => setData({...data, companySubtitle: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نص التوقيع (يمين)</label>
                <input type="text" value={data.signatureText} onChange={e => setData({...data, signatureText: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">النص أسفل الفاتورة (يسار)</label>
                <input type="text" value={data.footerText} onChange={e => setData({...data, footerText: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition text-left" dir="ltr" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <button onClick={() => setIsSettingsOpen(false)} className="w-full bg-[#3b3b98] text-white font-bold py-3 rounded-xl hover:bg-indigo-800 transition">
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Form Section */}
        <div className="xl:col-span-4 space-y-6 no-print sticky top-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col gap-4 border-b pb-4">
              <h2 className="text-xl font-bold text-gray-800">إعدادات الفاتورة</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setIsSettingsOpen(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition font-bold shadow-sm flex-1 sm:flex-none" title="الإعدادات">
                  <Settings size={20} />
                </button>
                <button onClick={handlePrint} className="bg-[#3b3b98] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-800 transition font-bold shadow-md flex-1 sm:flex-none">
                  <Printer size={20} />
                  <span className="text-sm">طباعة</span>
                </button>
                <button onClick={downloadPDF} disabled={isGeneratingPDF} className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition font-bold shadow-md disabled:opacity-50 flex-1 sm:flex-none">
                  {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
                  <span className="text-sm">PDF</span>
                </button>
                <button onClick={downloadWord} disabled={isGeneratingWord} className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition font-bold shadow-md disabled:opacity-50 flex-1 sm:flex-none">
                  {isGeneratingWord ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                  <span className="text-sm">Word</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رقم الفاتورة</label>
                <input type="text" value={data.invoiceNumber} onChange={e => setData({...data, invoiceNumber: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">التاريخ</label>
                <input type="text" value={data.date} onChange={e => setData({...data, date: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg border-b pb-2 text-gray-800">بيانات العميل</h3>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الاسم</label>
                <input type="text" value={data.customerName} onChange={e => setData({...data, customerName: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">العنوان</label>
                <input type="text" value={data.customerAddress} onChange={e => setData({...data, customerAddress: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف 1</label>
                  <input type="text" value={data.phone1} onChange={e => setData({...data, phone1: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف 2</label>
                  <input type="text" value={data.phone2} onChange={e => setData({...data, phone2: e.target.value})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition text-left" dir="ltr" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-lg text-gray-800">الأصناف</h3>
                <button onClick={addItem} className="text-[#3b3b98] flex items-center gap-1 text-sm font-bold hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition">
                  <Plus size={16} /> إضافة صنف
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                {data.items.map((item) => (
                  <div key={item.id} className="flex gap-2 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex-grow">
                      <label className="block text-xs font-bold text-gray-500 mb-1">الصنف</label>
                      <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#3b3b98] outline-none" />
                    </div>
                    <div className="w-16">
                      <label className="block text-xs font-bold text-gray-500 mb-1">الكمية</label>
                      <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-sm text-center focus:ring-2 focus:ring-[#3b3b98] outline-none" />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs font-bold text-gray-500 mb-1">السعر</label>
                      <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 text-sm text-center focus:ring-2 focus:ring-[#3b3b98] outline-none" />
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition mb-0.5">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">مصاريف الشحن</label>
                <input type="number" value={data.shippingCost} onChange={e => setData({...data, shippingCost: Number(e.target.value)})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">المدفوع مقدماً</label>
                <input type="number" value={data.deposit} onChange={e => setData({...data, deposit: Number(e.target.value)})} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3b3b98] outline-none transition" />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="xl:col-span-8 w-full overflow-x-auto pb-8 rounded-2xl">
          <div className="flex justify-center min-w-max p-4">
            <div id="invoice-preview" className="bg-[#ffffff] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] p-12 w-[21cm] min-h-[29.7cm] invoice-container relative mx-auto" dir="rtl">
              
              {/* Header */}
              <div className="flex justify-between items-start">
                {/* Right Side (Text) */}
                <div className="text-right pt-2">
                  <h1 className="text-5xl font-black text-[#312e81] tracking-tight mb-2" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {data.companyName}
                  </h1>
                  <p className="text-[#9ca3af] text-xl font-bold">{data.companySubtitle}</p>
                  <div className="mt-6 text-[#6b7280] font-bold text-lg">
                    <p>رقم الفاتورة: <span className="text-[#312e81]">{data.invoiceNumber}</span></p>
                    <p>التاريخ: <span className="text-[#6b7280]">{data.date}</span></p>
                  </div>
                </div>

                {/* Left Side (Logo) */}
                <div className="w-36 h-36 border border-[#f3f4f6] rounded-3xl flex items-center justify-center overflow-hidden bg-[#ffffff] p-2 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
                  {data.logoUrl ? (
                    <img src={data.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-center text-[#d1d5db] flex flex-col items-center justify-center h-full w-full bg-[#f9fafb] rounded-2xl">
                      <ImageIcon className="w-10 h-10 mb-2 text-[#d1d5db]" strokeWidth={1.5} />
                      <span className="text-xs font-bold">شعار الشركة</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Blue Line */}
              <div className="h-1.5 bg-[#4f46e5] w-full my-10 rounded-full"></div>

              {/* Customer Info */}
              <div className="bg-[#f8f9fa] rounded-3xl p-8 flex justify-between items-center mb-10 border border-[#f3f4f6]">
                <div className="text-right">
                  <p className="text-[#9ca3af] text-sm font-bold mb-2">بيانات العميل</p>
                  <h2 className="text-3xl font-bold text-[#111827]">{data.customerName}</h2>
                  <p className="text-[#6b7280] font-bold text-xl mt-2">{data.customerAddress}</p>
                </div>
                <div className="text-left" dir="ltr">
                  <p className="text-[#9ca3af] text-sm font-bold mb-2 text-right" dir="rtl">أرقام التواصل</p>
                  <p className="text-2xl font-bold text-[#111827]">{data.phone1}</p>
                  {data.phone2 && <p className="text-2xl font-bold text-[#111827] mt-1">{data.phone2}</p>}
                </div>
              </div>

              {/* Table */}
              <div className="mb-10 min-h-[200px]">
                {/* Table Header */}
                <div className="flex border-b-[3px] border-[#1f2937] pb-4 mb-6 text-[#9ca3af] font-bold text-xl">
                  <div className="flex-grow text-right">الصنف</div>
                  <div className="w-28 text-center">الكمية</div>
                  <div className="w-40 text-center">السعر</div>
                  <div className="w-40 text-left">الإجمالي</div>
                </div>

                {/* Table Body */}
                <div className="space-y-6">
                  {data.items.map((item) => (
                    <div key={item.id} className="flex text-2xl font-bold text-[#111827] items-center">
                      <div className="flex-grow text-right">{item.name}</div>
                      <div className="w-28 text-center">{item.quantity}</div>
                      <div className="w-40 text-center">{item.price} ج.م</div>
                      <div className="w-40 text-left">{item.quantity * item.price} ج.م</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Footer Line */}
              <div className="border-b-[3px] border-[#1f2937] mb-8"></div>

              {/* Totals */}
              <div className="flex justify-start mb-32">
                <div className="w-80">
                  <div className="flex justify-between text-[#6b7280] font-bold text-xl mb-3 px-2">
                    <span>مصاريف الشحن</span>
                    <span>{data.shippingCost} ج.م</span>
                  </div>
                  
                  {data.deposit > 0 && (
                    <div className="flex justify-between text-[#059669] font-bold text-xl mb-3 px-2">
                      <span>المدفوع مقدماً</span>
                      <span>{data.deposit} ج.م</span>
                    </div>
                  )}

                  <div className="bg-[#eef2ff] rounded-2xl p-5 flex justify-between items-center mt-4">
                    <span className="font-bold text-3xl text-[#111827]">الإجمالي:</span>
                    <span className="font-black text-3xl text-[#111827]">{calculateTotal()} ج.م</span>
                  </div>

                  {data.deposit > 0 && (
                    <div className="flex justify-between text-[#312e81] font-black text-2xl mt-6 px-2">
                      <span>المتبقي:</span>
                      <span>{calculateTotal() - data.deposit} ج.م</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end mt-20 pt-8 absolute bottom-12 left-12 right-12">
                <div className="text-[#d1d5db] italic font-bold text-2xl" style={{ fontFamily: 'Georgia, serif' }}>
                  {data.footerText}
                </div>
                <div className="text-center">
                  <div className="w-56 border-t-[3px] border-[#e5e7eb] mb-3"></div>
                  <span className="text-[#9ca3af] font-bold text-lg">{data.signatureText}</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
