import React, { useState, useEffect } from 'react';
import { Printer, Plus, Trash2, Image as ImageIcon, Settings, X, FileDown, FileText, Loader2, Eye, Save, History, Edit } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';

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
  qrCodeUrl: string;
  companyName: string;
  companySubtitle: string;
  footerText: string;
  signatureText: string;
}

const initialData: InvoiceData = {
  invoiceNumber: '',
  date: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
  customerName: '',
  customerAddress: '',
  phone1: '',
  phone2: '',
  items: [{ id: '1', name: '', quantity: 1, price: 0 }],
  shippingCost: 0,
  deposit: 0,
  logoUrl: '',
  qrCodeUrl: '',
  companyName: 'Mr & Mrs Fashion',
  companySubtitle: 'لأرقى الموديلات والأزياء الحديثة',
  footerText: 'Mr & Mrs Fashion',
  signatureText: 'إمضاء الاستلام'
};

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
    qrCodeUrl: '',
    companyName: 'Mr & Mrs Fashion',
    companySubtitle: 'لأرقى الموديلات والأزياء الحديثة',
    footerText: 'Mr & Mrs Fashion',
    signatureText: 'إمضاء الاستلام'
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [savedInvoices, setSavedInvoices] = useState<any[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedInvoices(invoices);
    }, (error) => {
      console.error("Error fetching invoices:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveInvoice = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'invoices'), {
        ...data,
        createdAt: serverTimestamp()
      });
      alert('تم حفظ الفاتورة بنجاح!');
      setData(initialData);
      setActiveTab('history');
      setShowPreview(false);
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert('حدث خطأ أثناء حفظ الفاتورة. تأكد من إعدادات Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice) return;
    try {
      const invoiceRef = doc(db, 'invoices', editingInvoice.id);
      await updateDoc(invoiceRef, {
        items: editingInvoice.items,
        shippingCost: editingInvoice.shippingCost,
        phone1: editingInvoice.phone1,
        phone2: editingInvoice.phone2,
        customerAddress: editingInvoice.customerAddress,
        deposit: editingInvoice.deposit
      });
      
      // Update the current preview data if it's the same invoice
      if (data.invoiceNumber === editingInvoice.invoiceNumber) {
        setData({
          ...data,
          items: editingInvoice.items,
          shippingCost: editingInvoice.shippingCost,
          phone1: editingInvoice.phone1,
          phone2: editingInvoice.phone2,
          customerAddress: editingInvoice.customerAddress,
          deposit: editingInvoice.deposit
        });
      }
      
      alert('تم تحديث الفاتورة بنجاح!');
      setEditingInvoice(null);
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert('حدث خطأ أثناء تحديث الفاتورة');
    }
  };

  const calculateSubtotal = () => {
    return data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + data.shippingCost;
  };

  const handlePrint = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    
    setIsPrinting(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 3, // جودة أعلى للطباعة
        useCORS: true,
        logging: false,
        scrollY: 0,
        windowHeight: element.scrollHeight,
        height: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
            <head>
              <title>طباعة الفاتورة - ${data.invoiceNumber}</title>
              <style>
                /* إعدادات الشاشة قبل الطباعة */
                body { 
                  background: #f3f4f6; 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  justify-content: flex-start; 
                  min-height: 100vh; 
                  font-family: system-ui, -apple-system, sans-serif;
                  margin: 0;
                  padding: 40px 20px;
                }
                .no-print { display: flex; flex-direction: column; align-items: center; width: 100%; }
                .print-btn { background: #4f46e5; color: white; padding: 15px 40px; border: none; border-radius: 10px; font-size: 20px; font-weight: bold; cursor: pointer; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background 0.3s; }
                .print-btn:hover { background: #4338ca; }
                .warning { color: #9a3412; background: #ffedd5; padding: 20px; border-radius: 10px; font-weight: bold; max-width: 600px; text-align: center; margin-bottom: 30px; border: 2px solid #fdba74; font-size: 18px; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                
                .container { display: none; } /* إخفاء الفاتورة في وضع الشاشة العادي لتجنب التكرار البصري */

                /* إعدادات الطباعة الصارمة */
                @media print {
                  @page { 
                    size: A4 portrait; 
                    margin: 0mm !important; 
                  }
                  * { 
                    box-sizing: border-box !important; 
                  }
                  html, body { 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    width: 100vw !important; 
                    height: 100vh !important; 
                    background: white !important; 
                    overflow: hidden !important;
                  }
                  .no-print { 
                    display: none !important; 
                  }
                  .container { 
                    display: flex !important; 
                    flex-direction: column !important; 
                    width: 100vw !important; 
                    height: 100vh !important; 
                    margin: 0 !important;
                    padding: 0 !important;
                    /* إجبار التمدد لسد أي فراغ جانبي قد يتركه المتصفح */
                    transform: scaleX(1.02) scaleY(1.01) !important; 
                    transform-origin: center top !important;
                  }
                  .half { 
                    width: 100vw !important; 
                    height: 50vh !important; 
                    display: block !important; 
                    border-bottom: 1px dashed #ccc !important; 
                    margin: 0 !important; 
                    padding: 0 !important;
                    overflow: hidden !important;
                  }
                  .half:last-child { 
                    border-bottom: none !important; 
                  }
                  /* إجبار الصورة على التمدد لملء العرض والارتفاع بالكامل (Stretching) */
                  img { 
                    width: 100vw !important; 
                    height: 50vh !important; 
                    object-fit: fill !important; 
                    display: block !important; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                  }
                }
              </style>
            </head>
            <body>
              <div class="no-print">
                <div class="warning">
                  ⚠️ تنبيه هام جداً للطباعة المثالية:<br/><br/>
                  قبل تأكيد الطباعة، يرجى التأكد من تغيير إعدادات الهوامش (Margins) في نافذة الطباعة إلى <strong>"بلا" (None)</strong> لضمان طباعة الفاتورة من الحافة للحافة.
                </div>
                <button class="print-btn" onclick="window.print()">🖨️ طباعة الفاتورة الآن</button>
              </div>

              <div class="container">
                <div class="half"><img src="${imgData}" /></div>
                <div class="half"><img src="${imgData}" /></div>
              </div>
              
              <script>
                window.onload = () => {
                  // فتح نافذة الطباعة تلقائياً بعد التحميل
                  setTimeout(() => {
                    window.print();
                  }, 800);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) لطباعة الفاتورة');
      }
    } catch (error) {
      console.error('Error printing:', error);
      alert('حدث خطأ أثناء تجهيز الطباعة');
    } finally {
      setIsPrinting(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    
    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 3, // High quality
        useCORS: true,
        logging: false,
        scrollY: 0,
        windowHeight: element.scrollHeight,
        height: element.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // استخدام مقاسات A4 القياسية (بالملليمتر)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const halfHeight = pageHeight / 2;
      
      // رسم النسخة الأولى (بالأعلى) - ممتدة بعرض الصفحة بالكامل
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, halfHeight);
      
      // رسم النسخة الثانية (بالأسفل) - ممتدة بعرض الصفحة بالكامل
      pdf.addImage(imgData, 'PNG', 0, halfHeight, pageWidth, halfHeight);
      
      // إضافة خط متقطع في المنتصف
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.setLineDashPattern([3, 3], 0);
      pdf.line(0, halfHeight, pageWidth, halfHeight);
      
      pdf.save(`Invoice_${data.invoiceNumber}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ أثناء إنشاء ملف PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadWord = async () => {
    setIsGeneratingWord(true);
    try {
      const children: any[] = [];

      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: data.companyName, bold: true, size: 48 })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: data.companySubtitle, size: 24, color: "666666" })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `رقم الفاتورة: ${data.invoiceNumber}` })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `التاريخ: ${data.date}` })],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "--------------------------------------------------" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "بيانات العميل", bold: true, size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `الاسم: ${data.customerName}` })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `العنوان: ${data.customerAddress}` })],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `رقم التواصل: ${data.phone1} ${data.phone2 ? ' / ' + data.phone2 : ''}` })],
        }),
        new Paragraph({ text: "" }),
      );

      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "الإجمالي", alignment: AlignmentType.CENTER })], shading: { fill: "F3F4F6" } }),
            new TableCell({ children: [new Paragraph({ text: "السعر", alignment: AlignmentType.CENTER })], shading: { fill: "F3F4F6" } }),
            new TableCell({ children: [new Paragraph({ text: "الكمية", alignment: AlignmentType.CENTER })], shading: { fill: "F3F4F6" } }),
            new TableCell({ children: [new Paragraph({ text: "الصنف", alignment: AlignmentType.CENTER })], shading: { fill: "F3F4F6" } }),
          ]
        }),
        ...data.items.map(item => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: `${item.quantity * item.price} ج.م`, alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: `${item.price} ج.م`, alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: `${item.quantity}`, alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ text: item.name, alignment: AlignmentType.RIGHT })] }),
          ]
        }))
      ];

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" })
      );

      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: `مصاريف الشحن: ${data.shippingCost} ج.م` })],
        })
      );

      if (data.deposit > 0) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: `المدفوع مقدماً: ${data.deposit} ج.م` })],
          })
        );
      }

      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new TextRun({ text: `الإجمالي: ${calculateTotal()} ج.م`, bold: true, size: 32 })],
        })
      );

      if (data.deposit > 0) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: `المتبقي: ${calculateTotal() - data.deposit} ج.م`, bold: true, size: 28 })],
          })
        );
      }

      children.push(
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "--------------------------------------------------" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: data.signatureText })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: data.footerText, color: "888888" })],
        })
      );

      const doc = new Document({
        sections: [{
          properties: {
            page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
          },
          children: children,
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

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({ ...data, qrCodeUrl: reader.result as string });
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

              {/* QR Code Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">رمز الاستجابة السريعة (QR Code)</label>
                <div className="flex items-center gap-4">
                  {data.qrCodeUrl && (
                    <img src={data.qrCodeUrl} alt="QR preview" className="w-12 h-12 rounded object-contain border" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleQrUpload} 
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
          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm">
            <button 
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${activeTab === 'create' ? 'bg-[#3b3b98] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Plus size={20} />
              إنشاء فاتورة
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-[#3b3b98] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <History size={20} />
              الفواتير السابقة
            </button>
          </div>

          {activeTab === 'history' ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">الفواتير المحفوظة</h2>
              {savedInvoices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد فواتير سابقة</p>
              ) : (
                savedInvoices.map(inv => (
                  <div key={inv.id} onClick={() => {
                    setData(inv);
                    setShowPreview(true);
                    setEditingInvoice(inv);
                  }} className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-[#3b3b98] transition group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-black text-[#3b3b98]">#{inv.invoiceNumber}</span>
                      <span className="text-sm font-bold text-gray-500">{inv.date}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="font-bold text-gray-800 text-lg">{inv.customerName}</p>
                      <button className="text-gray-400 group-hover:text-[#3b3b98] transition">
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">إعدادات الفاتورة</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowPreview(true)} className="xl:hidden bg-[#3b3b98] text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-800 transition font-bold shadow-sm">
                    <Eye size={20} />
                    <span className="text-sm">أظهر الفاتورة</span>
                  </button>
                  <button onClick={() => setIsSettingsOpen(true)} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition font-bold shadow-sm" title="الإعدادات">
                    <Settings size={20} />
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
          )}
        </div>

        {/* Preview Section */}
        <div className={`fixed inset-0 z-50 bg-gray-100 xl:static xl:bg-transparent xl:z-auto xl:col-span-8 w-full overflow-y-auto pb-8 rounded-2xl transition-all ${showPreview ? 'block' : 'hidden xl:block'}`}>
          
          {/* Action Buttons Header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-4 flex flex-wrap justify-center gap-3 border-b xl:border-none mb-4 shadow-sm xl:shadow-none no-print">
            <button onClick={() => setShowPreview(false)} className="xl:hidden bg-white text-gray-800 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm border hover:bg-gray-50">
              <X size={20} /> إغلاق
            </button>
            <button onClick={handlePrint} disabled={isPrinting} className="bg-[#3b3b98] text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-800 transition font-bold shadow-md disabled:opacity-50">
              {isPrinting ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20} />}
              <span>طباعة</span>
            </button>
            <button onClick={downloadPDF} disabled={isGeneratingPDF} className="bg-red-600 text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition font-bold shadow-md disabled:opacity-50">
              {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} />}
              <span>تحميل PDF</span>
            </button>
            <button onClick={downloadWord} disabled={isGeneratingWord} className="bg-blue-600 text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition font-bold shadow-md disabled:opacity-50">
              {isGeneratingWord ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
              <span>تحميل Word (قابل للتعديل)</span>
            </button>
            <button onClick={handleSaveInvoice} disabled={isSaving} className="bg-emerald-600 text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition font-bold shadow-md disabled:opacity-50">
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              <span>حفظ الفاتورة</span>
            </button>
          </div>

          <div className="flex justify-center min-w-max p-4">
            <div id="invoice-preview" className="bg-[#ffffff] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] py-8 px-2 sm:px-4 w-[21cm] min-h-[14.85cm] flex flex-col invoice-container relative mx-auto" dir="rtl">
              
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
              <div className="h-1.5 bg-[#4f46e5] w-full my-6 rounded-full"></div>

              {/* Customer Info */}
              <div className="bg-[#f8f9fa] rounded-3xl p-6 flex justify-between items-center mb-6 border border-[#f3f4f6]">
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
              <div className="mb-4">
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
              <div className="border-b-[3px] border-[#1f2937] mb-4 mt-6"></div>

              {/* Totals and QR */}
              <div className="flex justify-between items-start mb-6">
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

                {/* QR Code */}
                {data.qrCodeUrl && (
                  <div className="flex flex-col items-center justify-center p-2">
                    <div className="bg-white p-2 rounded-xl border border-[#e5e7eb] shadow-sm">
                      <img src={data.qrCodeUrl} alt="QR Code" className="w-24 h-24 object-contain" />
                    </div>
                    <span className="text-[#4f46e5] font-black text-sm mt-2 tracking-widest uppercase" style={{ fontFamily: 'Arial, sans-serif' }}>Scan Me</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-end mt-auto pt-4">
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
      {/* Edit Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 no-print" dir="rtl">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-[#3b3b98]">تعديل الفاتورة #{editingInvoice.invoiceNumber}</h2>
              <button onClick={() => setEditingInvoice(null)} className="text-gray-500 hover:text-red-500 transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Items */}
              <div>
                <h3 className="font-bold text-gray-700 mb-3">الأصناف</h3>
                {editingInvoice.items.map((item: any, index: number) => (
                  <div key={item.id} className="flex gap-3 mb-3">
                    <input 
                      type="text" 
                      value={item.name} 
                      onChange={(e) => {
                        const newItems = [...editingInvoice.items];
                        newItems[index].name = e.target.value;
                        setEditingInvoice({...editingInvoice, items: newItems});
                      }}
                      className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3b3b98] outline-none"
                      placeholder="اسم الصنف"
                    />
                    <input 
                      type="number" 
                      value={item.price} 
                      onChange={(e) => {
                        const newItems = [...editingInvoice.items];
                        newItems[index].price = Number(e.target.value);
                        setEditingInvoice({...editingInvoice, items: newItems});
                      }}
                      className="w-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3b3b98] outline-none text-center"
                      placeholder="السعر"
                    />
                  </div>
                ))}
              </div>

              {/* Other Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">مصاريف الشحن</label>
                  <input 
                    type="number" 
                    value={editingInvoice.shippingCost} 
                    onChange={(e) => setEditingInvoice({...editingInvoice, shippingCost: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3b3b98] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المدفوع مقدماً</label>
                  <input 
                    type="number" 
                    value={editingInvoice.deposit} 
                    onChange={(e) => setEditingInvoice({...editingInvoice, deposit: Number(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3b3b98] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف 1</label>
                  <input 
                    type="text" 
                    value={editingInvoice.phone1} 
                    onChange={(e) => setEditingInvoice({...editingInvoice, phone1: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3b3b98] outline-none text-left" dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف 2</label>
                  <input 
                    type="text" 
                    value={editingInvoice.phone2 || ''} 
                    onChange={(e) => setEditingInvoice({...editingInvoice, phone2: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3b3b98] outline-none text-left" dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">العنوان</label>
                  <input 
                    type="text" 
                    value={editingInvoice.customerAddress} 
                    onChange={(e) => setEditingInvoice({...editingInvoice, customerAddress: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3b3b98] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setEditingInvoice(null)} className="px-6 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                إلغاء
              </button>
              <button onClick={handleUpdateInvoice} className="px-6 py-3 rounded-xl font-bold text-white bg-[#3b3b98] hover:bg-indigo-800 transition">
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
