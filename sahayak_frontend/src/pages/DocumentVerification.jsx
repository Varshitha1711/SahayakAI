import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, ShieldCheck, Upload, Trash2, ArrowLeft, 
  Loader2, AlertCircle, FileCheck, ExternalLink 
} from 'lucide-react';
import { useAuth, API_BASE_URL } from '../contexts/AuthContext';

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
  const [emblemLoaded, setEmblemLoaded] = useState(false);

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
      className="min-h-screen flex flex-col relative overflow-x-hidden text-white"
      style={{
        background: 'linear-gradient(145deg, #060E1C 0%, #0F1B30 30%, #1A2C50 65%, #243965 100%)',
      }}
    >
      <div className="absolute inset-0 dot-pattern pointer-events-none" />
      <div className="orb animate-float" style={{ width: '550px', height: '550px', background: 'radial-gradient(circle, rgba(233,138,21,0.1) 0%, transparent 70%)', top: '-150px', left: '-150px' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-indigo-300">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          {emblemLoaded && (
            <img 
              src="/src/assets/emblem.png" 
              alt="State Emblem of India" 
              className="w-auto object-contain"
              style={{ 
                filter: 'url(#gold-emblem) drop-shadow(0 0 4px rgba(233,138,21,0.5))',
                clipPath: 'inset(11% 13% 11% 13%)',
                marginLeft: '-14px',
                marginRight: '-14px',
                height: '50px'
              }}
            />
          )}
          <span className="font-display text-lg font-bold tracking-tight">{t('documents.vaultTitle')}</span>
        </div>
        <div className="text-xs text-indigo-300 font-semibold bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> {t('documents.secureStorage')}
        </div>

        {/* Hidden Image for automatic asset-existence detection */}
        <img 
          src="/src/assets/emblem.png" 
          alt="" 
          style={{ display: 'none' }} 
          onLoad={() => setEmblemLoaded(true)} 
        />
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6">
        
        {/* Title block */}
        <div className="space-y-2 animate-fade-up">
          <h1 className="text-2xl font-bold font-display">{t('documents.title')}</h1>
          <p className="text-xs text-indigo-200/60 leading-relaxed max-w-xl">
            {t('documents.desc')}
          </p>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-300 animate-slide-up">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-300 animate-slide-up">
            <FileCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {successMsg}
          </div>
        )}

        {/* Documents Vault cards */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 border-2 rounded-full animate-spin text-amber-500" />
            <span className="text-xs text-indigo-300/60 uppercase font-semibold">{t('documents.vaultLoad')}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 animate-fade-up">
            {DOCUMENT_TYPES.map(docType => {
              const uploaded = uploadedDocs[docType.key];
              const isUploading = uploadingType === docType.key;

              return (
                <div 
                  key={docType.key}
                  className="glass-card rounded-2xl p-6 border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all hover:border-white/15"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      uploaded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-indigo-300'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                        {t(`documents.types.${docType.typeKey}.title`)}
                        {uploaded && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                            {t('documents.verified')}
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-indigo-300/60 mt-1 max-w-md leading-normal">
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
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-200 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all w-full md:w-auto justify-center"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> {t('documents.viewFile')}
                        </a>
                        <label 
                          className="bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer w-full md:w-auto justify-center"
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
        <div className="glass rounded-2xl p-5 border border-amber-500/10 bg-amber-500/[0.01] flex items-start gap-4 animate-fade-up">
          <ShieldCheck className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-200/80 leading-relaxed">
            <h4 className="font-bold text-white mb-1">{t('documents.privacyTitle')}</h4>
            {t('documents.privacyDesc')}
          </div>
        </div>

      </main>
      {/* Chroma key filter for converting white-to-transparent and black-to-gold */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="gold-emblem">
            <feColorMatrix 
              type="matrix" 
              values="0 0 0 0 0.91
                      0 0 0 0 0.54
                      0 0 0 0 0.08
                      -0.333 -0.333 -0.333 0 1" 
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
