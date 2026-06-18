import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, ShieldCheck, Upload, Trash2, ArrowLeft, 
  Loader2, AlertCircle, FileCheck, ExternalLink 
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import ProfileMenu from '../components/ProfileMenu';

const DOCUMENT_TYPES = [
  { 
    key: 'Aadhaar', 
    typeKey: 'aadhaar'
  },
  { 
    key: 'Income Certificate', 
    typeKey: 'income'
  },
  { 
    key: 'Caste Certificate', 
    typeKey: 'caste'
  }
];

export default function DocumentVerification() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State management
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [uploadingType, setUploadingType] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch already uploaded documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`);
      const docsMap = {};
      response.data.forEach(doc => {
        docsMap[doc.document_type] = doc;
      });
      setUploadedDocs(docsMap);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setErrorMsg(t('documents.vaultError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    fetchDocuments();
  }, [currentUser]);

  // Document keys selector helper
  const getDocKey = (type) => {
    if (type === 'Aadhaar') return 'aadhaar';
    if (type === 'Income Certificate') return 'income';
    return 'caste';
  };

  // Handle file selection and upload
  const handleFileUpload = async (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    // Client-side validations
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(t('documents.formatsError'));
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      setErrorMsg(t('documents.sizeError'));
      return;
    }

    setUploadingType(type);

    const formData = new FormData();
    formData.append('document_type', type);
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadedDocs(prev => ({
        ...prev,
        [type]: response.data
      }));
      setSuccessMsg(`${t(`documents.types.${getDocKey(type)}.title`)} ${t('documents.uploadSuccess')}`);
    } catch (err) {
      console.error('Upload failed:', err);
      const detail = err.response?.data?.detail || 'Failed to upload document. Please try again.';
      setErrorMsg(detail);
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <div
      className="min-h-screen flex text-slate-900 overflow-hidden bg-slate-50"
      style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <Sidebar activePage="documents" />

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen relative">
        <div className="absolute inset-0 dot-pattern pointer-events-none" />
        <div className="orb animate-float" style={{ width: '550px', height: '550px', background: 'radial-gradient(circle, rgba(233,138,21,0.05) 0%, transparent 70%)', top: '-150px', left: '-150px' }} />

        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-white border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('common.back', 'Back')}
            </button>
            <span className="font-display text-sm font-bold tracking-tight text-slate-900">{t('documents.vaultTitle')}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs text-slate-600 font-semibold bg-white px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> {t('documents.secureStorage')}
            </div>
            <ProfileMenu />
          </div>
        </header>

        {/* Main Container */}
        <main className="relative z-10 flex-grow max-w-4xl mx-auto w-full px-8 py-10 space-y-6">
          
          {/* Title block */}
          <div className="space-y-2 animate-fade-up">
            <h1 className="text-2xl font-bold font-display text-slate-900">{t('documents.title')}</h1>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
              {t('documents.desc')}
            </p>
          </div>

          {/* Global Notifications */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-650 animate-slide-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-700 animate-slide-up">
              <FileCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
              {successMsg}
            </div>
          )}

          {/* Documents Vault cards */}
          {loading ? (
            <div className="flex flex-col items-center py-20 gap-3">
              <Loader2 className="w-8 h-8 border-2 rounded-full animate-spin text-amber-500" />
              <span className="text-xs text-slate-500 uppercase font-semibold">{t('documents.vaultLoad')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 animate-fade-up">
              {DOCUMENT_TYPES.map(docType => {
                const uploaded = uploadedDocs[docType.key];
                const isUploading = uploadingType === docType.key;

                return (
                  <div 
                    key={docType.key}
                    className="glass-card rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        uploaded ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 border border-slate-200 text-slate-500'
                      }`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                          {t(`documents.types.${docType.typeKey}.title`)}
                          {uploaded && (
                            <span className="bg-emerald-55 text-emerald-700 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-200">
                              {t('documents.verified')}
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-md leading-normal">
                          {t(`documents.types.${docType.typeKey}.desc`)}
                        </p>
                      </div>
                    </div>

                    {/* Upload / View Action buttons */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {uploaded ? (
                        <div className="flex items-center gap-2.5 w-full md:w-auto">
                          <a 
                            href={uploaded.file_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all w-full md:w-auto justify-center shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> {t('documents.viewFile')}
                          </a>
                          <label 
                            className="bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer w-full md:w-auto justify-center shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5" /> {t('documents.reupload')}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(docType.key, e)} 
                            />
                          </label>
                        </div>
                      ) : (
                        <label 
                          className={`w-full md:w-auto btn-gold flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs ${
                            isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('documents.uploading')}
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" /> {t('documents.upload')}
                            </>
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={isUploading}
                            onChange={(e) => handleFileUpload(docType.key, e)} 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Security / Privacy Card */}
          <div className="rounded-2xl p-5 border border-amber-200 bg-amber-50/50 flex items-start gap-4 animate-fade-up shadow-sm">
            <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-slate-900 mb-1">{t('documents.privacyTitle')}</h4>
              {t('documents.privacyDesc')}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
