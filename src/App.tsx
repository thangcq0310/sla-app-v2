
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import {
  Truck, Warehouse, Users, Search, Plus, LayoutDashboard, FileText, ChevronLeft, ChevronRight, X, MapPin, LogOut, CheckCircle, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- REDESIGNED COMPONENTS ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-lifted-cream border border-dust-taupe rounded-[40px] shadow-halo p-6 transition-all hover-lift cursor-pointer ${className}`}>{children}</div>
);
const Eyebrow = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex items-center gap-2 text-sm font-bold text-slate-gray uppercase tracking-widest ${className}`}>
    <div className="w-1.5 h-1.5 rounded-pill bg-light-signal-orange"></div>
    {children}
  </div>
);
const Badge = ({ text, color = 'gray' }: { text: string; color?: 'gray' | 'orange' | 'red' | 'yellow' }) => {
  const colorClasses = {
    gray: 'border-dust-taupe text-slate-gray',
    orange: 'border-signal-orange text-signal-orange',
    red: 'border-mastercard-red text-mastercard-red',
    yellow: 'border-mastercard-yellow text-mastercard-yellow',
  };
  return <span className={`px-3 py-1 text-xs font-bold rounded-pill border ${colorClasses[color]}`}>{text}</span>;
};
const PrimaryButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`px-6 py-3 bg-ink-black text-canvas-cream rounded-[20px] font-[500] text-base tracking-[-0.02em] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);
const SecondaryButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`px-6 py-3 bg-white border border-ink-black text-ink-black rounded-[20px] font-[450] text-base tracking-[-0.02em] hover:bg-soft-bone transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);
const BrandLogo = ({isPill = false, isLight = false}) => (
    <div className={`flex items-center ${isPill ? 'justify-center' : 'gap-3'} ${isLight ? 'text-white' : 'text-ink-black'}`}>
        <div className="w-10 h-10 rounded-lg flex flex-shrink-0 items-center justify-center text-white font-black italic shadow-sm bg-gradient-to-br from-light-signal-orange to-signal-orange">
            NF
        </div>
        {!isPill && (
            <div className="overflow-hidden">
               <div className="font-extrabold text-lg tracking-tight leading-tight">NAFOODS</div>
               <div className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isLight ? 'text-gray-400' : 'text-slate-gray'}`}>LOGISTICS</div>
            </div>
        )}
    </div>
);
const Dialog = ({ title, message, onClose, type = 'success' }: { title: string, message: string, onClose: () => void, type?: 'success' | 'error' }) => {
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const color = type === 'success' ? 'text-green-500' : 'text-signal-orange';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <Card className="p-10 max-w-md w-full mx-4 text-center">
        <Icon className={`w-16 h-16 ${color} mx-auto mb-4`} />
        <h2 className={`text-2xl font-bold tracking-tight text-ink-black`}>{title}</h2>
        <p className="text-slate-gray mt-2 mb-8 text-base">{message}</p>
        <PrimaryButton onClick={onClose} className="w-full">Close</PrimaryButton>
      </Card>
    </div>
  );
};


// --- MAIN APP ---
export default function App() {
  // Core State
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App Data State
  const [transportKpiConfig, setTransportKpiConfig] = useState<any[]>([]);
  const [warehouseKpiConfig, setWarehouseKpiConfig] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [capas, setCapas] = useState<any[]>([]);
  const [factories, setFactories] = useState<any[]>([]);

  // UI/Form State
  const [isEditingKpi, setIsEditingKpi] = useState(false);
  const [editingType, setEditingType] = useState<'Transport' | 'Warehouse' | null>(null);
  const [editingKpiData, setEditingKpiData] = useState<any[]>([]);
  const [evaluationMonth, setEvaluationMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [vendorEvalMonth, setVendorEvalMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedMonths, setSubmittedMonths] = useState<string[]>([]);
  const [vendorScoresData, setVendorScoresData] = useState<any[]>([]);
  const [evaluationScores, setEvaluationScores] = useState<any[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorFilterType, setVendorFilterType] = useState('All');
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [vendorFormData, setVendorFormData] = useState<any>(null);
  const [showCapaForm, setShowCapaForm] = useState(false);
  const [capaFormData, setCapaFormData] = useState<any>(null);
  const [capaSearch, setCapaSearch] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<any>(null);
  const [showFactoryForm, setShowFactoryForm] = useState(false);
  const [factoryFormData, setFactoryFormData] = useState<any>(null);
  const [factorySearch, setFactorySearch] = useState('');
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' } | null>(null);

  // Auth State
  const [isLoading, setIsLoading] = useState(true);
  // Auth mode removed - only login
  const [authFormData, setAuthFormData] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountFormData, setAccountFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    const fetchFirestoreData = async () => {
      const factoriesCollection = collection(db, "factories");
      const factoriesSnapshot = await getDocs(factoriesCollection);
      const factoriesList = factoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFactories(factoriesList);

      const vendorsCollection = collection(db, "vendors");
      const vendorsSnapshot = await getDocs(vendorsCollection);
      const vendorsList = vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorsList);

      const capasCollection = collection(db, "capas");
      const capasSnapshot = await getDocs(capasCollection);
      const caspasList = capasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCapas(caspasList);

      const transportKpiCollection = collection(db, "transportKpi");
      const transportKpiSnapshot = await getDocs(transportKpiCollection);
      const transportKpiList = transportKpiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransportKpiConfig(transportKpiList);

      const warehouseKpiCollection = collection(db, "warehouseKpi");
      const warehouseKpiSnapshot = await getDocs(warehouseKpiCollection);
      const warehouseKpiList = warehouseKpiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWarehouseKpiConfig(warehouseKpiList);

      // Load submitted months for vendors
      const scoresCollection = collection(db, "vendorScores");
      const scoresSnapshot = await getDocs(scoresCollection);
      const allScores = scoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmittedMonths([...new Set(allScores.map((s: any) => s.month))]);
      setVendorScoresData(allScores);
    };

    fetchFirestoreData();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data(), email: firebaseUser.email });
        } else {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'admin' });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authFormData.email, authFormData.password);
      setAuthFormData({ email: '', password: '' });
    } catch (error: any) {
      setAuthError(error.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const dashboardStats = React.useMemo(() => {
    const calcAvg = (type: string) => {
      const filtered = vendors.filter(v => v.type === type);
      return filtered.length > 0 ? filtered.reduce((sum, v) => sum + v.score, 0) / filtered.length : 0;
    };
    const warehouseAvg = calcAvg('Warehouse');
    const transportAvg = calcAvg('Transport');
    const trendData = [];
    let lastWarehouse = warehouseAvg;
    let lastTransport = transportAvg;
    trendData.push({ name: 'Now', warehouse: warehouseAvg, transport: transportAvg });
    for (let i = 1; i <= 3; i++) {
        const whVar = lastWarehouse + (Math.random() * 6 - 3);
        const trVar = lastTransport + (Math.random() * 6 - 3);
        lastWarehouse = Math.max(75, Math.min(98, whVar));
        lastTransport = Math.max(75, Math.min(98, trVar));
        trendData.unshift({ name: `-${i}mo`, warehouse: lastWarehouse, transport: lastTransport });
    }
    return { warehouseAvg, transportAvg, trendData };
  }, [vendors]);

  const vendorNameForFilter = React.useMemo(() => {
     if (user?.role === 'vendor' && user.vendorId) {
        return vendors.find(v => v.id === user.vendorId)?.name || '';
     }
     return '';
  }, [user, vendors]);

  const handleAddVendor = () => {
    const maxIdNum = vendors.reduce((max, v) => {
        const match = v.id?.match(/^VN-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const newId = `VN-${(maxIdNum + 1).toString().padStart(3, '0')}`;
    setVendorFormData({
        id: newId,
        name: '',
        type: 'Warehouse',
        factory: factories[0]?.name || '',
        contact: '',
        phone: '',
        email: '',
        score: 100,
        critical: false
    });
    setActiveTab('vendors');
    setSelectedVendor(null);
    setShowVendorForm(true);
  };

const handleEditVendor = (vendor: any) => {
      setVendorFormData({ ...vendor });
      setShowVendorForm(true);
   };

  const handleCreateVendorAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !accountFormData.email || !accountFormData.password) return;

    try {
      const cred = await createUserWithEmailAndPassword(auth, accountFormData.email, accountFormData.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: accountFormData.email,
        role: 'vendor',
        vendorId: selectedVendor.id,
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, "vendors", selectedVendor.id), { ...selectedVendor, userId: cred.user.uid });

      const vendorsCollection = collection(db, "vendors");
      const vendorsSnapshot = await getDocs(vendorsCollection);
      const vendorsList = vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorsList);
      setSelectedVendor({ ...selectedVendor, userId: cred.user.uid });

      setShowAccountForm(false);
      setAccountFormData({ email: '', password: '' });
      setDialogState({ isOpen: true, title: 'Success', message: 'Vendor account has been created.', type: 'success' });
    } catch (error: any) {
      setDialogState({ isOpen: true, title: 'Error', message: error.message || 'Failed to create account', type: 'error' });
    }
  };

  const handleResetVendorAccount = async (vendor: any) => {
    if (!vendor.userId) return;
    setDialogState({ isOpen: true, title: 'Reset Password', message: 'Password reset email has been sent to vendor.', type: 'success' });
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorFormData) return;

    try {
      await setDoc(doc(db, "vendors", vendorFormData.id), vendorFormData);

      const vendorsCollection = collection(db, "vendors");
      const vendorsSnapshot = await getDocs(vendorsCollection);
      const vendorsList = vendorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorsList);

      setShowVendorForm(false);
      setVendorFormData(null);
      if (selectedVendor) setSelectedVendor(vendorFormData);
      setDialogState({ isOpen: true, title: 'Success', message: 'Vendor has been saved successfully.', type: 'success' });
    } catch (error) {
      console.error("Error saving vendor: ", error);
      setDialogState({ isOpen: true, title: 'Error', message: 'Failed to save vendor. Please try again.', type: 'error' });
    }
  };

  const handleAddCapa = () => {
     setCapaFormData({ vendor: vendors[0]?.name || '', issue: '', rootCause: '', actionPlan: '', status: 'Open', priority: 'Medium', date: new Date().toISOString().split('T')[0] });
     setActiveTab('capa');
     setShowCapaForm(true);
  };

  const handleEditCapa = (capa: any) => {
     setCapaFormData({ ...capa });
     setShowCapaForm(true);
  };

  const handleSaveCapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capaFormData) return;

    try {
      if (capaFormData.id) {
        await updateDoc(doc(db, "capas", capaFormData.id), capaFormData);
      } else {
        await addDoc(collection(db, "capas"), capaFormData);
      }

      const capasCollection = collection(db, "capas");
      const capasSnapshot = await getDocs(capasCollection);
      const capasList = capasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCapas(capasList);

      setShowCapaForm(false);
      setCapaFormData(null);
      setDialogState({ isOpen: true, title: 'Success', message: 'CAPA report has been saved successfully.', type: 'success' });
    } catch (error) {
      console.error("Error saving CAPA: ", error);
      setDialogState({ isOpen: true, title: 'Error', message: 'Failed to save CAPA report. Please try again.', type: 'error' });
    }
  };

  const handleAddFactory = () => {
    const newId = `FAC-${(factories.length + 1).toString().padStart(3, '0')}`;
    setFactoryFormData({ id: newId, name: '', address: '', status: 'Active' });
    setActiveTab('factories');
    setSelectedFactory(null);
    setShowFactoryForm(true);
  };

  const handleEditFactory = (factory: any) => {
    setFactoryFormData({ ...factory });
    setShowFactoryForm(true);
  };

  const handleSaveFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryFormData) return;

    try {
      await setDoc(doc(db, "factories", factoryFormData.id), factoryFormData);

      const factoriesCollection = collection(db, "factories");
      const factoriesSnapshot = await getDocs(factoriesCollection);
      const factoriesList = factoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFactories(factoriesList);

      setShowFactoryForm(false);
      setFactoryFormData(null);
      if (selectedFactory) setSelectedFactory(factoryFormData);
       setDialogState({ isOpen: true, title: 'Success', message: 'Factory has been saved successfully.', type: 'success' });
    } catch (error) {
      console.error("Error saving factory: ", error);
      setDialogState({ isOpen: true, title: 'Error', message: 'Failed to save factory. Please try again.', type: 'error' });
    }
  };

  const handleSaveConfig = async () => {
       if (editingKpiData.reduce((s, i) => s + Number(i.weight), 0) !== 100) {
            setDialogState({ isOpen: true, title: 'Invalid Weight', message: 'Total weight for all criteria must be exactly 100%.', type: 'error' });
           return;
       }
       if (!editingType) return;
       const collectionName = editingType === 'Transport' ? 'transportKpi' : 'warehouseKpi';
       try {
        for (const kpi of editingKpiData) {
            const { id, ...kpiData } = kpi;
            if (id.startsWith('new_')) {
                await addDoc(collection(db, collectionName), kpiData);
            } else {
                await updateDoc(doc(db, collectionName, id), kpiData);
            }
        }
        setIsEditingKpi(false);
        setDialogState({ isOpen: true, title: 'Success', message: 'KPI configuration has been saved successfully.', type: 'success' });
       } catch (error) {
          console.error("Error saving KPI config: ", error);
          setDialogState({ isOpen: true, title: 'Error', message: 'Failed to save KPI configuration. Please try again.', type: 'error' });
}
   };

  const handleSaveDraft = () => {
    setDialogState({ isOpen: true, title: 'Saved', message: 'Draft has been saved.', type: 'success' });
  };

  const handleSubmitScore = async () => {
    if (!selectedVendor || !evaluationMonth) return;
    if (submittedMonths.includes(evaluationMonth)) {
      setDialogState({ isOpen: true, title: 'Already Submitted', message: `Score for ${evaluationMonth} has already been submitted.`, type: 'error' });
      return;
    }
    try {
      // Save scores for this month
      const monthDocId = `${selectedVendor.id}_${evaluationMonth}`;
      const config = selectedVendor.type === 'Transport' ? transportKpiConfig : warehouseKpiConfig;
      const scoresData = config?.map((kpi: any) => ({
        criteriaId: kpi.id,
        criteriaLabel: kpi.label,
        weight: kpi.weight,
        target: kpi.target,
        score: 100
      })) || [];

      await setDoc(doc(db, "vendorScores", monthDocId), {
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        month: evaluationMonth,
        type: selectedVendor.type,
        scores: scoresData,
        createdAt: new Date().toISOString()
      });

      setSubmittedMonths([...submittedMonths, evaluationMonth]);

      setIsSubmitted(true);
      setDialogState({ isOpen: true, title: 'Success', message: `Score for ${evaluationMonth} has been submitted successfully.`, type: 'success' });
    } catch (error: any) {
      setDialogState({ isOpen: true, title: 'Error', message: error.message || 'Failed to submit score.', type: 'error' });
    }
  };

// --- RENDER METHODS ---
  const renderDashboard = () => {
    const StatCard = ({ title, value, subtext }: {title:string, value:string, subtext:string}) => (
        <Card className="p-8">
            <Eyebrow>{title}</Eyebrow>
            <div className="text-3xl font-medium my-3 tracking-tighter">{value}</div>
            <p className="text-slate-gray text-sm">{subtext}</p>
        </Card>
    );
    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <StatCard title="Warehouse Performance" value={`${dashboardStats.warehouseAvg.toFixed(1)}%`} subtext="Average score this month" />
          <StatCard title="Transport Performance" value={`${dashboardStats.transportAvg.toFixed(1)}%`} subtext="Average score this month" />
          <StatCard title="Grade A Vendors" value={`${vendors.filter(v => v.score >= 90).length}`} subtext={`of ${vendors.length} total vendors`} />
          <StatCard title="Open CAPAs" value={`${capas.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length}`} subtext="Require corrective action" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          <Card className="lg:col-span-3 p-8 flex flex-col h-[350px]">
            <Eyebrow>4-Month Performance Trend</Eyebrow>
            <div className="flex-1 min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardStats.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D1CDC7" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#696969', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#696969', fontSize: 12}} domain={[60, 100]} tickFormatter={(v) => v.toFixed(0) + '%'} />
                  <Tooltip cursor={{stroke: '#D1CDC7'}} contentStyle={{ borderRadius: '20px', border: '1px solid #D1CDC7' }} formatter={(v: any) => v.toFixed(2) + '%'} />
                  <Line type="monotone" dataKey="warehouse" name="Warehouse" stroke="#CF4500" strokeWidth={3} dot={{r: 5}} />
                  <Line type="monotone" dataKey="transport" name="Transport" stroke="#F37338" strokeWidth={3} dot={{r: 5}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-2 p-8 flex flex-col h-[350px]">
            <Eyebrow>Vendor Classification</Eyebrow>
             <div className="flex-1 flex items-center justify-center">
                <div className="w-40 h-40 rounded-pill border-[20px] border-signal-orange border-r-light-signal-orange border-b-slate-gray relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-medium leading-none">{vendors.length}</div>
                    <div className="text-sm font-bold text-slate-gray uppercase tracking-widest">Vendors</div>
                  </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="font-medium text-lg">{vendors.length > 0 ? ((vendors.filter(v => v.score >= 90).length / vendors.length) * 100).toFixed(0) : 0}%</div>
                    <div className="text-sm text-slate-gray">Grade A</div>
                </div>
                 <div>
                    <div className="font-medium text-lg">{vendors.length > 0 ? ((vendors.filter(v => v.score >= 80 && v.score < 90).length / vendors.length) * 100).toFixed(0) : 0}%</div>
                    <div className="text-sm text-slate-gray">Grade B</div>
                </div>
                 <div>
                    <div className="font-medium text-lg">{vendors.length > 0 ? ((vendors.filter(v => v.score < 80).length / vendors.length) * 100).toFixed(0) : 0}%</div>
                    <div className="text-sm text-slate-gray">Grade C</div>
                </div>
            </div>
          </Card>
        </div>

        {/* 3-Month Vendor Performance Table */}
        <Card className="p-8">
          <Eyebrow>Vendor Performance - Last 3 Months</Eyebrow>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dust-taupe">
                  <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray">Vendor</th>
                  <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">
                    {(() => {
                      const now = new Date();
                      const m2 = new Date(now.getFullYear(), now.getMonth() - 2).toISOString().slice(0, 7);
                      return m2.replace('-', '/').split('/')[1] + '/' + m2.split('-')[0];
                    })()}
                  </th>
                  <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">
                    {(() => {
                      const now = new Date();
                      const m1 = new Date(now.getFullYear(), now.getMonth() - 1).toISOString().slice(0, 7);
                      return m1.replace('-', '/').split('/')[1] + '/' + m1.split('-')[0];
                    })()}
                  </th>
                  <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">
                    {(() => {
                      const now = new Date();
                      const m0 = now.toISOString().slice(0, 7);
                      return m0.replace('-', '/').split('/')[1] + '/' + m0.split('-')[0];
                    })()}
                  </th>
                  <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Average</th>
                  <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => {
                  const getMonthScore = (monthsAgo: number) => {
                    const targetMonth = new Date();
                    targetMonth.setMonth(targetMonth.getMonth() - monthsAgo);
                    const monthStr = targetMonth.toISOString().slice(0, 7);
                    const vendorScore = vendorScoresData.find(s => s.vendorId === v.id && s.month === monthStr);
                    if (!vendorScore?.scores) return v.score || 0;
                    return vendorScore.scores.reduce((sum: number, s: any) => sum + (s.score * s.weight / 100), 0);
                  };

                  const m2 = getMonthScore(2);
                  const m1 = getMonthScore(1);
                  const m0 = getMonthScore(0);
                  const avg = (m2 + m1 + m0) / 3;
                  const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : 'C';

                  return (
                    <tr key={v.id} className="border-b border-dust-taupe hover:bg-canvas-cream cursor-pointer transition-colors" onClick={() => { setSelectedVendor(v); setActiveTab('vendors'); }}>
                      <td className="py-4 px-4">
                        <div className="font-medium">{v.name}</div>
                        <div className="text-sm text-slate-gray font-mono">{v.id}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-medium">{m2 > 0 ? m2.toFixed(1) + '%' : '-'}</td>
                      <td className="py-4 px-4 text-center font-medium">{m1 > 0 ? m1.toFixed(1) + '%' : '-'}</td>
                      <td className="py-4 px-4 text-center font-medium">{m0 > 0 ? m0.toFixed(1) + '%' : '-'}</td>
                      <td className="py-4 px-4 text-center font-bold">{avg > 0 ? avg.toFixed(1) + '%' : '-'}</td>
                      <td className="py-4 px-4 text-center">
                        <Badge text={`Grade ${grade}`} color={grade === 'A' ? 'gray' : grade === 'B' ? 'orange' : 'red'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const renderSLAInput = (type: 'Transport' | 'Warehouse') => {
    const config = type === 'Transport' ? transportKpiConfig : warehouseKpiConfig;
    const handleEditConfig = () => {
       setEditingType(type);
       setEditingKpiData(JSON.parse(JSON.stringify(config)));
       setIsEditingKpi(true);
    };
    if (isEditingKpi && editingType === type) {
       return (
         <div className="animate-fade-in max-w-4xl mx-auto">
           <button onClick={() => setIsEditingKpi(false)} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-gray hover:text-ink-black transition-colors">
             <ChevronLeft size={16} /> Back to SLA Evaluation
           </button>
           <Card className="p-10">
             <h2 className="text-xl font-bold tracking-tight m-0">KPI Criteria Configuration ({type})</h2>
             <p className="text-slate-gray mt-2 mb-8">Define the criteria and weights for SLA scoring. Total weight must equal 100%.</p>
             <div className="space-y-4 mb-6">
                {editingKpiData.map((item, index) => (
                   <div key={item.id} className="flex flex-wrap gap-4 p-5 border border-dust-taupe rounded-xl bg-canvas-cream items-center">
                      <div className="flex-1 min-w-[200px]">
                         <label className="block text-xs font-bold text-slate-gray uppercase mb-1">Criteria Name</label>
                         <input type="text" value={item.label} onChange={(e) => {
                            const d = [...editingKpiData]; d[index].label = e.target.value; setEditingKpiData(d);
                         }} className="w-full px-4 py-2 border border-dust-taupe rounded-pill text-sm font-semibold" />
                      </div>
                      <div className="w-24">
                         <label className="block text-xs font-bold text-slate-gray uppercase mb-1">Weight (%)</label>
                         <input type="number" value={item.weight} onChange={(e) => {
                            const d = [...editingKpiData]; d[index].weight = Number(e.target.value); setEditingKpiData(d);
                         }} className="w-full px-4 py-2 border border-dust-taupe rounded-pill text-sm font-bold text-center" />
                      </div>
                      <div className="w-24">
                         <label className="block text-xs font-bold text-slate-gray uppercase mb-1">Target (%)</label>
                         <input type="number" value={item.target} onChange={(e) => {
                           const d = [...editingKpiData]; d[index].target = Number(e.target.value); setEditingKpiData(d);
                         }} className="w-full px-4 py-2 border border-dust-taupe rounded-pill text-sm font-bold text-center" />
                      </div>
                      <div className="flex items-center gap-4 pt-5">
                         <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                            <input type="checkbox" checked={item.critical} onChange={(e) => {
                               const d = [...editingKpiData]; d[index].critical = e.target.checked; setEditingKpiData(d);
                            }} className="w-5 h-5 cursor-pointer rounded-md" />
                            Critical
                         </label>
                         <button onClick={() => setEditingKpiData(editingKpiData.filter((_, i) => i !== index))} className="text-slate-gray hover:text-signal-orange transition-colors">
                            <X size={16} />
                         </button>
                      </div>
                   </div>
                ))}
             </div>
             <SecondaryButton onClick={() => setEditingKpiData([...editingKpiData, { id: `new_${Date.now()}`, label: 'New Criteria', weight: 0, target: 100, critical: false }])} className="w-full !border-dashed">
                + Add New Criteria
             </SecondaryButton>
             <div className="flex justify-end gap-4 pt-8 mt-8 border-t border-dust-taupe">
                <SecondaryButton onClick={() => setIsEditingKpi(false)}>Cancel</SecondaryButton>
                <PrimaryButton onClick={handleSaveConfig}>Save Configuration</PrimaryButton>
             </div>
           </Card>
         </div>
       );
    }
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        <Card className="p-8">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">SLA Evaluation Form</h3>
                    <p className="text-slate-gray">Score vendors based on the pre-defined KPI criteria for <span className="font-bold text-ink-black">{type}</span> services.</p>
                </div>
                <SecondaryButton onClick={handleEditConfig} className="flex-shrink-0">Edit Criteria</SecondaryButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-dust-taupe">
                <div>
                    <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Select Vendor</label>
                    <select className="w-full border border-dust-taupe rounded-pill px-5 py-3 text-base outline-none focus:border-ink-black transition-colors bg-white appearance-none">
                        {vendors.filter(v => v.type === type).map(v => <option key={v.id}>{v.name}</option>)}
                    </select>
                </div>
                <div>
<label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Evaluation Period</label>
                      <input
                        type="month"
                        value={evaluationMonth}
                        onChange={(e) => {
                          setEvaluationMonth(e.target.value);
                          setIsSubmitted(submittedMonths.includes(e.target.value));
                        }}
                        className="w-full border border-dust-taupe rounded-pill px-5 py-3 text-base outline-none focus:border-ink-black transition-colors bg-white"
                      />
                </div>
            </div>
        </Card>
        <Card className="p-8">
            <h3 className="text-xl font-bold tracking-tight mb-6">KPI Scoring</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-dust-taupe">
                            <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray">Criteria</th>
                            <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Weight</th>
                            <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Target</th>
                            <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Critical</th>
                            <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {config.map((kpi, idx) => {
                            const scoreValue = 100;
                            return (
                                <tr key={kpi.id} className="border-b border-dust-taupe">
                                    <td className="py-4 px-4 font-medium">{kpi.label}</td>
                                    <td className="py-4 px-4 text-center">{kpi.weight}%</td>
                                    <td className="py-4 px-4 text-center">{kpi.target}%</td>
                                    <td className="py-4 px-4 text-center">{kpi.critical ? <Badge text="Critical" color="orange" /> : ''}</td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="relative inline-block">
                                            <input
                                                type="number"
                                                defaultValue={scoreValue}
                                                onChange={(e) => {
                                                    const newScores = [...evaluationScores];
                                                    newScores[idx] = { criteriaId: kpi.id, score: Number(e.target.value), weight: kpi.weight };
                                                    setEvaluationScores(newScores);
                                                }}
                                                className="w-28 px-4 py-2 border bg-white border-dust-taupe rounded-pill text-center text-lg font-bold outline-none"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-gray">%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
           {/* Final Weighted Score */}
           <div className="mt-6 pt-6 border-t border-dust-taupe flex justify-between items-center">
             <div className="text-base font-bold text-slate-gray uppercase">Final Weighted Score</div>
             <div className="text-2xl font-bold text-signal-orange">
               {(() => {
                 const total = config?.reduce((sum: number, kpi: any, idx: number) => {
                   const score = evaluationScores[idx]?.score ?? 100;
                   return sum + (score * kpi.weight / 100);
                 }, 0) ?? 0;
                 return total.toFixed(1) + '%';
               })()}
             </div>
           </div>
        </Card>
<div className="mt-8 pt-8 border-t border-dust-taupe flex justify-end gap-4">
              <SecondaryButton onClick={() => window.print()}>Print / Save as PDF</SecondaryButton>
              <SecondaryButton onClick={handleSaveDraft} disabled={isSubmitted}>Save Draft</SecondaryButton>
              <PrimaryButton onClick={handleSubmitScore} disabled={isSubmitted}>
                {isSubmitted ? 'Submitted' : 'Submit Score'}
              </PrimaryButton>
         </div>
      </div>
    );
  };

  const renderVendorManagement = () => {
    const getGrade = (score: number) => score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
    if (showVendorForm) {
      return (
         <div className="animate-fade-in max-w-3xl mx-auto">
           <button onClick={() => setShowVendorForm(false)} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-gray hover:text-ink-black transition-colors">
             <ChevronLeft size={16} /> Back to Vendor List
           </button>
           <Card className="p-10">
             <h2 className="text-xl font-bold tracking-tight">{selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
             <form onSubmit={handleSaveVendor} className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Vendor ID</label>
                     <input required type="text" value={vendorFormData?.id || ''} disabled className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-canvas-cream/50 outline-none opacity-60" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Vendor Name</label>
                     <input required type="text" value={vendorFormData?.name || ''} onChange={(e) => setVendorFormData({...vendorFormData, name: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Service Type</label>
                     <select value={vendorFormData?.type || 'Warehouse'} onChange={(e) => setVendorFormData({...vendorFormData, type: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black appearance-none">
                        <option value="Warehouse">Warehouse</option>
                        <option value="Transport">Transport</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Factory</label>
                     <select value={vendorFormData?.factory || ''} onChange={(e) => setVendorFormData({...vendorFormData, factory: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black appearance-none">
                        {factories.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Contact Person</label>
                     <input required type="text" value={vendorFormData?.contact || ''} onChange={(e) => setVendorFormData({...vendorFormData, contact: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Phone</label>
                     <input required type="text" value={vendorFormData?.phone || ''} onChange={(e) => setVendorFormData({...vendorFormData, phone: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black" />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Email</label>
                     <input required type="email" value={vendorFormData?.email || ''} onChange={(e) => setVendorFormData({...vendorFormData, email: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black" />
                   </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-dust-taupe mt-6">
                   <SecondaryButton type="button" onClick={() => setShowVendorForm(false)}>Cancel</SecondaryButton>
                   <PrimaryButton type="submit">Save Vendor</PrimaryButton>
                </div>
             </form>
           </Card>
        </div>
      );
    }
    if (selectedVendor) {
      return (
        <div className="animate-fade-in max-w-4xl mx-auto">
          <button onClick={() => setSelectedVendor(null)} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-gray hover:text-ink-black transition-colors">
             <ChevronLeft size={16} /> Back to List
          </button>
          <Card className="p-10">
            <div className="flex justify-between items-start">
               <div>
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-2xl font-bold m-0 tracking-tight">{selectedVendor.name}</h2>
                        {selectedVendor.critical && <Badge text="Critical" color="orange"/>}
                    </div>
                    <Eyebrow>{selectedVendor.id}</Eyebrow>
               </div>
               <SecondaryButton onClick={() => handleEditVendor(selectedVendor)}>Edit</SecondaryButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-dust-taupe">
                <div><Eyebrow>Service Type</Eyebrow><div className="text-lg font-semibold mt-1">{selectedVendor.type}</div></div>
                <div><Eyebrow>Factory</Eyebrow><div className="text-lg font-semibold mt-1">{selectedVendor.factory}</div></div>
                <div><Eyebrow>Current Score</Eyebrow><div className="text-2xl font-bold mt-1">{selectedVendor.score.toFixed(1)}%</div></div>
                <div><Eyebrow>Contact Person</Eyebrow><div className="text-lg font-semibold mt-1">{selectedVendor.contact}</div></div>
                <div><Eyebrow>Phone</Eyebrow><div className="text-lg font-semibold mt-1">{selectedVendor.phone}</div></div>
                <div><Eyebrow>Email</Eyebrow><div className="text-lg font-semibold text-light-signal-orange hover:underline cursor-pointer mt-1">{selectedVendor.email}</div></div>
            </div>
            <div className="mt-8 pt-8 border-t border-dust-taupe">
              <div className="flex items-center justify-between">
                <div>
                  <Eyebrow>Vendor Account</Eyebrow>
                  <p className="text-sm text-slate-gray mt-1">Create login account for this vendor to access SLA and CAPA.</p>
                </div>
                {!selectedVendor.userId ? (
                  <PrimaryButton onClick={() => setShowAccountForm(true)}>Create Account</PrimaryButton>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge text="Account Created" color="gray" />
                    <SecondaryButton onClick={() => handleResetVendorAccount(selectedVendor)}>Reset Password</SecondaryButton>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {showAccountForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
              <Card className="max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Create Vendor Account</h2>
                  <button onClick={() => setShowAccountForm(false)} className="text-slate-gray hover:text-ink-black">
                    <X size={20} />
                  </button>
                </div>
                <p className="text-sm text-slate-gray mb-6">Creating account for: <span className="font-semibold text-ink-black">{selectedVendor.name}</span></p>
                <form onSubmit={handleCreateVendorAccount} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Email</label>
                    <input type="email" required value={accountFormData.email} onChange={(e) => setAccountFormData({...accountFormData, email: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Password</label>
                    <input type="password" required minLength={6} value={accountFormData.password} onChange={(e) => setAccountFormData({...accountFormData, password: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <SecondaryButton type="button" onClick={() => setShowAccountForm(false)}>Cancel</SecondaryButton>
                    <PrimaryButton type="submit">Create Account</PrimaryButton>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      );
    }
    const filteredVendors = vendors.filter(v =>
      (vendorFilterType === 'All' || v.type === vendorFilterType) &&
      (v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || v.id.toLowerCase().includes(vendorSearch.toLowerCase()))
    );
return (
      <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4 mb-2">
             <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-gray" />
                <input
                  type="text"
                  placeholder="Search vendors by name or ID..."
                  className="w-full pl-14 pr-5 py-4 bg-white border-2 border-transparent rounded-pill text-base font-medium outline-none focus:border-dust-taupe shadow-sm transition-colors"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                />
             </div>
             <select
               className="px-6 py-4 bg-white border-2 border-transparent rounded-pill text-base font-bold text-ink-black outline-none cursor-pointer shadow-sm appearance-none"
               value={vendorFilterType}
               onChange={(e) => setVendorFilterType(e.target.value)}
             >
               <option value="All">All Services</option>
               <option value="Warehouse">Warehouse</option>
               <option value="Transport">Transport</option>
             </select>
          </div>
          <Card className="overflow-hidden">
             <table className="w-full text-left">
               <thead className="bg-white">
                 <tr>
                   <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Vendor</th>
                   <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Service</th>
                   <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Factory</th>
                   <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Score</th>
                   <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Grade</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredVendors.map((item) => (
                   <tr key={item.id} className="hover:bg-canvas-cream cursor-pointer transition-colors group border-t border-dust-taupe" onClick={() => setSelectedVendor(item)}>
                     <td className="py-5 px-6">
                       <div className="font-medium text-base text-ink-black group-hover:text-light-signal-orange transition-colors">{item.name}</div>
                       <div className="text-sm text-slate-gray font-mono">{item.id}</div>
                     </td>
                     <td className="py-5 px-6 text-base font-medium">{item.type}</td>
                     <td className="py-5 px-6 text-base font-medium">{item.factory}</td>
                     <td className="py-5 px-6 text-lg font-bold">{item.score.toFixed(1)}%</td>
                     <td className="py-5 px-6"><Badge text={`Grade ${getGrade(item.score)}`} color={item.critical ? 'orange' : 'gray'} /></td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {filteredVendors.length === 0 && (
               <div className="p-20 text-center">
                  <FileText className="w-12 h-12 text-dust-taupe mx-auto mb-4" />
                  <p className="text-ink-black font-bold text-lg">No vendors found.</p>
                  <p className="text-slate-gray text-base mt-2">Try adjusting your search or filters.</p>
               </div>
             )}
          </Card>
      </div>
    );
  };

  const renderFactoryManagement = () => {
    if (showFactoryForm) {
      return (
        <div className="animate-fade-in max-w-3xl mx-auto">
          <button onClick={() => setShowFactoryForm(false)} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-gray hover:text-ink-black transition-colors">
            <ChevronLeft size={16} /> Back to Factory List
          </button>
          <Card className="p-10">
            <h2 className="text-xl font-bold tracking-tight">{selectedFactory ? 'Edit Factory' : 'Add New Factory'}</h2>
            <form onSubmit={handleSaveFactory} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Factory ID</label>
                  <input required type="text" value={factoryFormData?.id || ''} disabled className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-canvas-cream/50 outline-none opacity-60" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Factory Name</label>
                  <input required type="text" value={factoryFormData?.name || ''} onChange={(e) => setFactoryFormData({...factoryFormData, name: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Status</label>
                  <select value={factoryFormData?.status || 'Active'} onChange={(e) => setFactoryFormData({...factoryFormData, status: e.target.value})} className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black appearance-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Address</label>
                  <textarea required value={factoryFormData?.address || ''} onChange={(e) => setFactoryFormData({...factoryFormData, address: e.target.value})} className="w-full border border-dust-taupe rounded-2xl px-5 py-3 bg-white outline-none focus:border-ink-black" rows={2} />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-dust-taupe mt-6">
                <SecondaryButton type="button" onClick={() => setShowFactoryForm(false)}>Cancel</SecondaryButton>
                <PrimaryButton type="submit">Save Factory</PrimaryButton>
              </div>
            </form>
          </Card>
        </div>
      );
    }
    if (selectedFactory) {
      return (
        <div className="animate-fade-in max-w-4xl mx-auto">
          <button onClick={() => setSelectedFactory(null)} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-gray hover:text-ink-black transition-colors">
            <ChevronLeft size={16} /> Back to List
          </button>
          <Card className="p-10">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-2xl font-bold m-0 tracking-tight">{selectedFactory.name}</h2>
                  <Badge text={selectedFactory.status} color={selectedFactory.status === 'Active' ? 'gray' : 'orange'} />
                </div>
                <Eyebrow>{selectedFactory.id}</Eyebrow>
              </div>
              <SecondaryButton onClick={() => handleEditFactory(selectedFactory)}>Edit</SecondaryButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 pt-8 border-t border-dust-taupe">
              <div><Eyebrow>Address</Eyebrow><div className="text-lg font-semibold mt-1">{selectedFactory.address}</div></div>
            </div>
          </Card>
        </div>
      );
    }
    const filteredFactories = factories.filter(f =>
      f.name.toLowerCase().includes(factorySearch.toLowerCase()) ||
      f.id.toLowerCase().includes(factorySearch.toLowerCase())
    );
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-gray" />
          <input
            type="text"
            placeholder="Search factories by name or ID..."
            className="w-full pl-14 pr-5 py-4 bg-white border-2 border-transparent rounded-pill text-base font-semibold outline-none focus:border-dust-taupe shadow-sm transition-colors"
            value={factorySearch}
            onChange={(e) => setFactorySearch(e.target.value)}
          />
        </div>
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white">
              <tr>
                <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Factory</th>
                <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Address</th>
                <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFactories.map((item) => (
                <tr key={item.id} className="hover:bg-canvas-cream cursor-pointer transition-colors group border-t border-dust-taupe" onClick={() => setSelectedFactory(item)}>
                  <td className="py-5 px-6">
                    <div className="font-bold text-base text-ink-black group-hover:text-light-signal-orange transition-colors">{item.name}</div>
                    <div className="text-sm text-slate-gray font-mono">{item.id}</div>
                  </td>
                  <td className="py-5 px-6 text-base text-slate-gray max-w-xs truncate">{item.address}</td>
                  <td className="py-5 px-6"><Badge text={item.status} color={item.status === 'Active' ? 'gray' : 'orange'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFactories.length === 0 && (
            <div className="p-20 text-center">
              <FileText className="w-12 h-12 text-line mx-auto mb-4" />
              <p className="text-ink-black font-bold text-lg">No factories found.</p>
              <p className="text-slate-gray text-base mt-2">Try adjusting your search or add a new factory.</p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderCapaManagement = () => {
    const PRIORITY_COLOR: Record<string, 'orange' | 'yellow' | 'gray'> = { 'High': 'orange', 'Medium': 'yellow', 'Low': 'gray' };
    const STATUS_COLOR: Record<string, 'gray' | 'yellow'> = { 'Open': 'yellow', 'In Progress': 'yellow', 'Resolved': 'gray', 'Closed': 'gray' };
    if (showCapaForm) {
      return (
        <div className="animate-fade-in max-w-3xl mx-auto">
          <button onClick={() => setShowCapaForm(false)} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-gray hover:text-ink-black transition-colors">
            <ChevronLeft size={16} /> Back to CAPA List
          </button>
          <Card className="p-10">
            <h2 className="text-xl font-bold tracking-tight">{capaFormData?.id ? 'Edit CAPA Report' : 'Add New CAPA Report'}</h2>
            <form onSubmit={handleSaveCapa} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Vendor</label>
                  <select
                    required
                    value={capaFormData?.vendor || ''}
                    onChange={(e) => setCapaFormData({ ...capaFormData, vendor: e.target.value })}
                    className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black appearance-none"
                  >
                    {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Date</label>
                  <input
                    required
                    type="date"
                    value={capaFormData?.date || ''}
                    onChange={(e) => setCapaFormData({ ...capaFormData, date: e.target.value })}
                    className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Issue</label>
                  <textarea
                    required
                    value={capaFormData?.issue || ''}
                    onChange={(e) => setCapaFormData({ ...capaFormData, issue: e.target.value })}
                    className="w-full border border-dust-taupe rounded-2xl px-5 py-3 bg-white outline-none focus:border-ink-black"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Root Cause</label>
                  <textarea
                    required
                    value={capaFormData?.rootCause || ''}
                    onChange={(e) => setCapaFormData({ ...capaFormData, rootCause: e.target.value })}
                    className="w-full border border-dust-taupe rounded-2xl px-5 py-3 bg-white outline-none focus:border-ink-black"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Action Plan</label>
                  <textarea
                    required
                    value={capaFormData?.actionPlan || ''}
                    onChange={(e) => setCapaFormData({ ...capaFormData, actionPlan: e.target.value })}
                    className="w-full border border-dust-taupe rounded-2xl px-5 py-3 bg-white outline-none focus:border-ink-black"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Priority</label>
                  <select
                    required
                    value={capaFormData?.priority || 'Medium'}
                    onChange={(e) => setCapaFormData({ ...capaFormData, priority: e.target.value })}
                    className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black appearance-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-gray uppercase mb-2 ml-4">Status</label>
                  <select
                    required
                    value={capaFormData?.status || 'Open'}
                    onChange={(e) => setCapaFormData({ ...capaFormData, status: e.target.value })}
                    className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black appearance-none"
                  >
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Resolved</option>
                    <option>Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-6 border-t border-dust-taupe mt-6">
                <SecondaryButton type="button" onClick={() => setShowCapaForm(false)}>Cancel</SecondaryButton>
                <PrimaryButton type="submit">Save CAPA</PrimaryButton>
              </div>
            </form>
          </Card>
        </div>
      );
    }
    const baseCapas = user?.role === 'vendor' ? capas.filter(c => c.vendor === vendorNameForFilter) : capas;
    const filteredCapas = baseCapas.filter(c => c.issue.toLowerCase().includes(capaSearch.toLowerCase()) || (c.id && c.id.toLowerCase().includes(capaSearch.toLowerCase())) || c.vendor.toLowerCase().includes(capaSearch.toLowerCase()));
    const sortedCapas = [...filteredCapas].sort((a,b) => (a.date < b.date) ? 1 : -1 );
    return (
      <div className="space-y-6 animate-fade-in">
         <div className="relative flex-1">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-gray" />
           <input
             type="text"
             placeholder="Search CAPAs by ID, issue, or vendor..."
             className="w-full pl-14 pr-5 py-4 bg-white border-2 border-transparent rounded-pill text-base font-semibold outline-none focus:border-dust-taupe shadow-sm transition-colors"
             value={capaSearch}
             onChange={(e) => setCapaSearch(e.target.value)}
           />
        </div>
         <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">CAPA ID</th>
                  <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Date</th>
                  <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Vendor</th>
                  <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Issue</th>
                  <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Priority</th>
                  <th className="py-4 px-6 text-sm font-bold uppercase text-slate-gray tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedCapas.map((item) => (
                  <tr key={item.id} className={`border-t border-dust-taupe transition-colors ${user?.role === 'admin' ? 'hover:bg-canvas-cream cursor-pointer group' : ''}`} onClick={() => { if(user?.role === 'admin') handleEditCapa(item) }}>
                    <td className="py-5 px-6 font-mono text-sm">{item.id}</td>
                    <td className="py-5 px-6 text-slate-gray text-sm">{item.date}</td>
                    <td className="py-5 px-6 font-semibold" title={item.vendor}>{item.vendor}</td>
                    <td className="py-5 px-6 text-ink-black max-w-xs truncate" title={item.issue}>{item.issue}</td>
                    <td className="py-5 px-6"><Badge text={item.priority} color={PRIORITY_COLOR[item.priority]}/></td>
                    <td className="py-5 px-6"><Badge text={item.status} color={STATUS_COLOR[item.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedCapas.length === 0 && (
              <div className="p-20 text-center">
<FileText className="w-12 h-12 text-dust-taupe mx-auto mb-4" />
                 <p className="text-ink-black font-bold text-lg">No CAPAs found.</p>
                 <p className="text-slate-gray text-base mt-2">No corrective actions match your current search.</p>
              </div>
            )}
         </Card>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-light-signal-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-gray font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  const renderAuthForm = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="p-10 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <BrandLogo />
        </div>
        <h2 className="text-xl font-medium text-center tracking-tight text-ink-black">
          Welcome Back
        </h2>
        <p className="text-slate-gray text-center mt-2 mb-6">
          Sign in to continue
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              required
              value={authFormData.email}
              onChange={(e) => setAuthFormData({...authFormData, email: e.target.value})}
              className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              required
              value={authFormData.password}
              onChange={(e) => setAuthFormData({...authFormData, password: e.target.value})}
              className="w-full border border-dust-taupe rounded-pill px-5 py-3 bg-white outline-none focus:border-ink-black transition-colors"
            />
          </div>
          {authError && <p className="text-signal-orange text-sm text-center">{authError}</p>}
          <PrimaryButton type="submit" className="w-full">
            Sign In
          </PrimaryButton>
        </form>
        <div className="mt-8 pt-6 border-t border-dust-taupe flex justify-center">
          <p className="text-sm text-slate-gray">Powered by Thangcq.NAF © 2026</p>
        </div>
      </Card>
    </div>
  );

  if (!user) {
    return renderAuthForm();
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-canvas-cream text-ink-black font-sans print:h-auto print:overflow-visible print:bg-white">
       {dialogState?.isOpen && (
        <Dialog
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type}
          onClose={() => setDialogState(null)}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <aside className={`bg-ink-black text-white p-6 flex flex-col h-full flex-shrink-0 print:hidden transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-[104px] items-center' : 'w-[280px]'}`}>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-4 top-10 w-8 h-8 bg-white border border-dust-taupe rounded-pill flex items-center justify-center text-slate-gray hover:text-ink-black shadow-md cursor-pointer transition-all z-10"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          <div className={`mb-12 w-full ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
            <BrandLogo isPill={isSidebarCollapsed} isLight={true}/>
          </div>

          <nav className="flex-1 w-full flex flex-col gap-2">
            {user.role === 'admin' ? (
              <>
                {[ {tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard}, {tab: 'transport_sla', label: 'Transport SLA', icon: Truck}, {tab: 'warehouse_sla', label: 'Warehouse SLA', icon: Warehouse}, {tab: 'vendors', label: 'Vendors', icon: Users}, {tab: 'factories', label: 'Factories', icon: MapPin}, {tab: 'capa', label: 'CAPA Reports', icon: FileText} ].map(item => (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    title={isSidebarCollapsed ? item.label : ""}
                    className={`w-full flex items-center gap-4 ${isSidebarCollapsed ? 'justify-center px-0 h-14' : 'px-4 h-12'} rounded-pill text-sm font-medium tracking-tightest transition-all ${activeTab === item.tab ? 'bg-canvas-cream text-ink-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                      <item.icon size={20} />
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                  </button>
                ))}
              </>
            ) : (
              <>
                {[ {tab: 'my_profile', label: 'My SLA Score', icon: LayoutDashboard}, {tab: 'my_capa', label: 'My CAPA Reports', icon: FileText}, ].map(item => (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    title={isSidebarCollapsed ? item.label : ""}
                    className={`w-full flex items-center gap-4 ${isSidebarCollapsed ? 'justify-center px-0 h-14' : 'px-4 h-12'} rounded-pill text-sm font-medium tracking-tightest transition-all ${activeTab === item.tab ? 'bg-canvas-cream text-ink-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                      <item.icon size={20} />
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                  </button>
                ))}
              </>
            )}
          </nav>

          <div className="mt-auto pt-4 border-t border-white/10">
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : 'px-4'} mb-2`}>
              <div className="w-10 h-10 rounded-pill bg-light-signal-orange flex items-center justify-center text-white font-bold text-sm">
                {user.email?.[0].toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.email}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role}</div>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-4 ${isSidebarCollapsed ? 'justify-center px-0 h-12' : 'px-4 h-10'} rounded-pill text-sm font-medium tracking-tightest text-gray-400 hover:bg-white/10 hover:text-white transition-colors`}
            >
              <LogOut size={20} />
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <main className="flex-1 p-10 h-full overflow-y-auto w-full print:p-0 print:overflow-visible">
          <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-10 print:hidden">
            <div>
              <Eyebrow>{activeTab.replace('_', ' ').replace('sla', 'SLA')}</Eyebrow>
<h1 className="text-3xl font-bold m-0 tracking-tighter mt-2">
                  {activeTab === 'dashboard' ? 'Performance Insights' :
                  activeTab === 'vendors' ? 'Vendor Network' :
                  activeTab === 'factories' ? 'Factory Network' :
                  activeTab.includes('capa') ? 'Corrective Actions' :
                  activeTab === 'my_profile' ? 'My SLA Score' : 'SLA Evaluation'}
                </h1>
            </div>

{user.role === 'admin' && (
                <div className="flex gap-4 flex-shrink-0">
                  <PrimaryButton onClick={activeTab === 'factories' ? handleAddFactory : activeTab.includes('capa') ? handleAddCapa : handleAddVendor}>
                    <Plus size={16} className="inline -ml-2 mr-2"/>
                    {activeTab === 'factories' ? 'New Factory' : activeTab.includes('capa') ? 'New CAPA' : 'New Vendor'}
                  </PrimaryButton>
                </div>
              )}
          </header>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'transport_sla' && renderSLAInput('Transport')}
          {activeTab === 'warehouse_sla' && renderSLAInput('Warehouse')}
{activeTab === 'my_profile' && (() => {
              const v = vendors.find(v => v.id === user.vendorId);
              const config = v?.type === 'Transport' ? transportKpiConfig : warehouseKpiConfig;
              const vendorMonthScores = vendorScoresData.find(s => s.vendorId === v?.id && s.month === vendorEvalMonth);

              if (user.isNew) {
                return (
                  <div className="text-center p-8 animate-fade-in">
                    <Card className="max-w-lg mx-auto p-10">
                      <Users className="w-12 h-12 text-dust-taupe mx-auto mb-4" />
                      <h2 className="text-xl font-bold">Welcome!</h2>
                      <p className="text-slate-gray mt-2">Your account has been created, but your vendor profile is not yet set up.</p>
                      <p className="text-slate-gray mt-2">Please contact an administrator to finalize your account and assign you to a specific vendor.</p>
                    </Card>
                  </div>
                );
              }
              if (!v) return <div className="text-center p-8">Error: Could not find your vendor profile. Please contact an admin.</div>;
              return (
                <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
                  <Card className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                              <div className="flex items-center gap-4 mb-2">
                                  <h2 className="text-2xl font-bold m-0 tracking-tight">{v.name}</h2>
                                  {v.critical && <Badge text="Critical Account" color="orange"/>}
                              </div>
                              <Eyebrow>{v.id}</Eyebrow>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-gray">Current Score</div>
                            <div className="text-3xl font-bold text-signal-orange">{v.score.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-slate-gray uppercase">Evaluation Period</label>
                        <input
                          type="month"
                          value={vendorEvalMonth}
                          onChange={(e) => setVendorEvalMonth(e.target.value)}
                          className="border border-dust-taupe rounded-pill px-4 py-2 bg-white outline-none focus:border-ink-black"
                        />
                      </div>
                  </Card>

                  <Card className="p-8">
                      <Eyebrow>Criteria Scores</Eyebrow>
                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-dust-taupe">
                              <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray">Criteria</th>
                              <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Critical</th>
                              <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Weight</th>
                              <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Target</th>
                              <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Score</th>
                              <th className="py-3 px-4 text-sm font-bold uppercase text-slate-gray text-center">Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {config?.map((criteria: any) => {
                                const savedScore = vendorMonthScores?.scores?.find((s: any) => s.criteriaId === criteria.id);
                                const criteriaScore = savedScore?.score ?? v?.score ?? 0;
                                const isPass = criteriaScore >= criteria.target;

                                return (
                                <tr key={criteria.id} className="border-b border-dust-taupe">
                                    <td className="py-4 px-4 font-medium">{criteria.label}</td>
                                    <td className="py-4 px-4 text-center">{criteria.critical ? <Badge text="Critical" color="orange"/> : ''}</td>
                                    <td className="py-4 px-4 text-center">{criteria.weight}%</td>
                                    <td className="py-4 px-4 text-center">{criteria.target}%</td>
                                    <td className="py-4 px-4 text-center font-bold">
                                    {criteriaScore.toFixed(1)}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                    <Badge
                                        text={isPass ? 'Pass' : 'Fail'}
                                        color={isPass ? 'gray' : 'orange'}
                                    />
                                    </td>
                                </tr>
                                );
                            })}
                          </tbody>
                        </table>
                      </div>
                  </Card>
                </div>
              );
          })()}
          {activeTab === 'my_capa' && renderCapaManagement()}
          {activeTab === 'vendors' && renderVendorManagement()}
          {activeTab === 'factories' && renderFactoryManagement()}
          {activeTab === 'capa' && renderCapaManagement()}
        </main>
      </div>
      <footer className="py-4 border-t border-dust-taupe bg-canvas-cream flex justify-center">
        <p className="text-sm text-slate-gray">Powered by Thangcq.NAF © 2026</p>
      </footer>
    </div>
  );
}
