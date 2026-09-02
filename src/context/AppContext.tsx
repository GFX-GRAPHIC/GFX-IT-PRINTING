import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  CategoryItem,
  Customer,
  Expense,
  FinishingItem,
  MachineItem,
  MaterialItem,
  ProductCategory,
  Order,
  OrderStatus,
  PaymentMethod,
  PurchaseOrder,
  CashierShift,
  StoreSettings,
  User,
  ProductionBillItem,
  WorkerDebtItem,
} from '../types';
import {
  initialCategories,
  initialCustomers,
  initialExpenses,
  initialFinishing,
  initialMachines,
  initialMaterials,
  initialOrders,
  initialPurchaseOrders,
  initialShifts,
  initialStoreSettings,
  createApparelSizeVariants,
  initialProductionBills,
  initialWorkerDebts,
} from '../utils/sampleData';
import { generateOrderNumber, generateSpkNumber } from '../utils/formatters';
import { sounds } from '../utils/soundEffects';

interface AppContextType {
  orders: Order[];
  customers: Customer[];
  materials: MaterialItem[];
  categories: CategoryItem[];
  finishings: FinishingItem[];
  machines: MachineItem[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  shifts: CashierShift[];
  currentShift: CashierShift | null;
  storeSettings: StoreSettings;
  productionBills: ProductionBillItem[];
  workerDebts: WorkerDebtItem[];

  // Production Bills & Worker Debts actions
  addProductionBill: (bill: Omit<ProductionBillItem, 'id' | 'billNumber' | 'createdAt'>) => ProductionBillItem;
  updateProductionBill: (bill: ProductionBillItem) => void;
  deleteProductionBill: (id: string) => void;
  payProductionBill: (billId: string, method: 'cash' | 'transfer', notes?: string) => void;
  addWorkerDebt: (debt: Omit<WorkerDebtItem, 'id' | 'debtNumber' | 'createdAt' | 'history'>) => WorkerDebtItem;
  updateWorkerDebt: (debt: WorkerDebtItem) => void;
  deleteWorkerDebt: (id: string) => void;
  deductBillFromDebt: (billId: string, debtId: string, amount: number) => { success: boolean; message: string };

  // Category actions
  addCategory: (category: Omit<CategoryItem, 'id'>) => void;
  updateCategory: (category: CategoryItem) => void;
  deleteCategory: (categoryId: string) => void;

  // Shift actions
  startShift: (openingCash: number, cashier: User, notes?: string) => CashierShift;
  closeShift: (shiftId: string, actualCash: number, closingNotes?: string) => CashierShift;

  // Order actions
  addOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'spkNumber' | 'createdAt' | 'updatedAt' | 'timeline'>, currentUser: User) => Order;
  updateOrder: (order: Order, currentUser: User, note?: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, currentUser: User, note?: string) => void;
  addPaymentToOrder: (orderId: string, amount: number, method: PaymentMethod, currentUser: User) => void;
  cancelOrder: (orderId: string, currentUser: User, reason?: string) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void;

  // Customer actions
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'unpaidBalance' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (customerId: string) => void;

  // Material actions
  addMaterial: (material: Omit<MaterialItem, 'id'>) => void;
  updateMaterial: (material: MaterialItem) => void;
  deleteMaterial: (materialId: string) => void;
  bulkUpdateMaterials: (updates: { id: string; costPrice?: number; sellingPrice?: number; stock?: number; minStock?: number }[]) => void;
  bulkAddMaterials: (newItems: Omit<MaterialItem, 'id'>[]) => void;

  // Finishing actions
  addFinishing: (finishing: Omit<FinishingItem, 'id'>) => void;
  updateFinishing: (finishing: FinishingItem) => void;
  deleteFinishing: (finishingId: string) => void;

  // Machine actions
  updateMachine: (machine: MachineItem) => void;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id' | 'expenseNumber'>) => void;
  deleteExpense: (expenseId: string) => void;

  // Purchase Order actions
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => PurchaseOrder;
  updatePurchaseOrder: (po: PurchaseOrder) => void;
  deletePurchaseOrder: (poId: string) => void;
  receivePurchaseOrder: (poId: string) => void;

  // Settings
  updateStoreSettings: (settings: StoreSettings) => void;
  resetToDefaultData: () => void;

  // Dark Mode Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ORDERS: 'cetakpro_orders',
  CUSTOMERS: 'cetakpro_customers',
  MATERIALS: 'cetakpro_materials',
  CATEGORIES: 'cetakpro_categories',
  FINISHINGS: 'cetakpro_finishings',
  MACHINES: 'cetakpro_machines',
  EXPENSES: 'cetakpro_expenses',
  PURCHASE_ORDERS: 'cetakpro_purchase_orders',
  SHIFTS: 'cetakpro_shifts',
  SETTINGS: 'cetakpro_settings',
  PRODUCTION_BILLS: 'cetakpro_production_bills',
  WORKER_DEBTS: 'cetakpro_worker_debts',
  THEME: 'cetakpro_theme',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : initialOrders;
    } catch {
      return initialOrders;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (saved) {
        const parsed: MaterialItem[] = JSON.parse(saved);
        // Automatically merge all Shopee & initial materials so new items are always available!
        const existingIds = new Set(parsed.map((m) => m.id));
        const missingInitial = initialMaterials.filter((m) => !existingIds.has(m.id));
        const combined = [...parsed, ...missingInitial];

        // Normalize any outdated legacy categories and auto-attach sizeVariants to apparel
        return combined.map((m: MaterialItem) => {
          const cat = (m.category || '').toUpperCase();
          const lowerName = (m.name || '').toLowerCase();
          const isApparel =
            lowerName.includes('jersey') ||
            lowerName.includes('jaket') ||
            lowerName.includes('baju') ||
            lowerName.includes('kaos');

          let updatedM: MaterialItem = { ...m };
          if (cat === 'LARGE_FORMAT') {
            updatedM.category =
              m.name.toLowerCase().includes('outdoor') ||
              m.name.toLowerCase().includes('flexi') ||
              m.name.toLowerCase().includes('spanduk')
                ? 'OUTDOOR'
                : 'INDOOR';
          } else if (cat !== 'OUTDOOR' && cat !== 'INDOOR') {
            updatedM.category = cat as ProductCategory;
          }

          if (isApparel && (!updatedM.sizeVariants || updatedM.sizeVariants.length === 0)) {
            updatedM.hasVariants = true;
            updatedM.variantTitle = 'Ukuran';
            updatedM.sizeVariants = createApparelSizeVariants(
              updatedM.sellingPrice,
              updatedM.costPrice,
              updatedM.stock
            );
          }

          return updatedM;
        });
      }
      return initialMaterials;
    } catch {
      return initialMaterials;
    }
  });

  const [finishings, setFinishings] = useState<FinishingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FINISHINGS);
      return saved ? JSON.parse(saved) : initialFinishing;
    } catch {
      return initialFinishing;
    }
  });

  const [machines, setMachines] = useState<MachineItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MACHINES);
      return saved ? JSON.parse(saved) : initialMachines;
    } catch {
      return initialMachines;
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : initialExpenses;
    } catch {
      return initialExpenses;
    }
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
      return saved ? JSON.parse(saved) : initialPurchaseOrders;
    } catch {
      return initialPurchaseOrders;
    }
  });

  const [shifts, setShifts] = useState<CashierShift[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
      return saved ? JSON.parse(saved) : initialShifts;
    } catch {
      return initialShifts;
    }
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : initialStoreSettings;
    } catch {
      return initialStoreSettings;
    }
  });

  const [productionBills, setProductionBills] = useState<ProductionBillItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTION_BILLS);
      return saved ? JSON.parse(saved) : initialProductionBills;
    } catch {
      return initialProductionBills;
    }
  });

  const [workerDebts, setWorkerDebts] = useState<WorkerDebtItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WORKER_DEBTS);
      return saved ? JSON.parse(saved) : initialWorkerDebts;
    } catch {
      return initialWorkerDebts;
    }
  });

  // Dark Mode State & Synchronization
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved !== null) {
        return saved === 'dark';
      }
      // Check system preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(STORAGE_KEYS.THEME, 'light');
      }
    } catch (e) {
      console.error('Failed to sync dark mode:', e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FINISHINGS, JSON.stringify(finishings));
  }, [finishings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTION_BILLS, JSON.stringify(productionBills));
  }, [productionBills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WORKER_DEBTS, JSON.stringify(workerDebts));
  }, [workerDebts]);

  // Live calculation of current active shift
  const currentShift = useMemo(() => {
    const open = shifts.find((s) => s.status === 'open');
    if (!open) return null;

    const shiftStart = open.startTime;
    let totalCashSales = 0;
    let totalNonCashSales = 0;

    orders.forEach((o) => {
      if (o.createdAt >= shiftStart && o.paidAmount > 0) {
        if (o.paymentMethod === 'cash') {
          totalCashSales += o.paidAmount;
        } else {
          totalNonCashSales += o.paidAmount;
        }
      }
    });

    let totalExpenses = 0;
    expenses.forEach((e) => {
      if (e.date >= shiftStart && e.paymentMethod === 'cash') {
        totalExpenses += e.amount;
      }
    });

    const expectedCash = open.openingCash + totalCashSales - totalExpenses;

    return {
      ...open,
      totalCashSales,
      totalNonCashSales,
      totalExpenses,
      expectedCash,
    };
  }, [shifts, orders, expenses]);

  // Order Actions
  const addOrder = (
    orderData: Omit<Order, 'id' | 'orderNumber' | 'spkNumber' | 'createdAt' | 'updatedAt' | 'timeline'>,
    currentUser: User
  ): Order => {
    const nextSeq = orders.length + 1;
    const now = new Date().toISOString();
    const orderNumber = generateOrderNumber(nextSeq);
    const spkNumber = generateSpkNumber(nextSeq);

    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Date.now().toString().slice(-6)}`,
      orderNumber,
      spkNumber,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: `TL-${Date.now()}`,
          timestamp: now,
          status: orderData.status || 'pending',
          user: currentUser.name,
          userRole: currentUser.role,
          note: `Pesanan dibuat (${orderData.paymentStatus === 'paid' ? 'Lunas' : orderData.paymentStatus === 'dp' ? 'DP' : 'Tempo'})`,
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update or create customer
    setCustomers((prev) => {
      const existing = prev.find((c) => c.id === orderData.customerId || c.phone === orderData.customerPhone);
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                totalOrders: c.totalOrders + 1,
                totalSpent: c.totalSpent + orderData.paidAmount,
                unpaidBalance: c.unpaidBalance + orderData.balance,
              }
            : c
        );
      } else {
        const newCust: Customer = {
          id: `CUST-${Date.now().toString().slice(-4)}`,
          name: orderData.customerName,
          phone: orderData.customerPhone,
          type: orderData.customerType,
          totalOrders: 1,
          totalSpent: orderData.paidAmount,
          unpaidBalance: orderData.balance,
          createdAt: now,
        };
        return [newCust, ...prev];
      }
    });

    sounds.playSuccess();
    return newOrder;
  };

  const updateOrder = (updatedOrder: Order, currentUser: User, note?: string) => {
    const now = new Date().toISOString();
    const timelineEntry = note
      ? {
          id: `TL-${Date.now()}`,
          timestamp: now,
          status: updatedOrder.status,
          user: currentUser.name,
          userRole: currentUser.role,
          note,
        }
      : null;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === updatedOrder.id
          ? {
              ...updatedOrder,
              updatedAt: now,
              timeline: timelineEntry ? [...o.timeline, timelineEntry] : o.timeline,
            }
          : o
      )
    );
  };

  const updateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    currentUser: User,
    note?: string
  ) => {
    const now = new Date().toISOString();
    const statusLabels: Record<OrderStatus, string> = {
      pending: 'Menunggu Antrean',
      design: 'Proses Desain',
      production: 'Proses Cetak',
      finishing: 'Finishing / Pasca Cetak',
      ready: 'Siap Diambil / Dikirim',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    };

    const actionNote = note || `Status diperbarui ke: ${statusLabels[newStatus]}`;

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          updatedAt: now,
          timeline: [
            ...o.timeline,
            {
              id: `TL-${Date.now()}`,
              timestamp: now,
              status: newStatus,
              user: currentUser.name,
              userRole: currentUser.role,
              note: actionNote,
            },
          ],
        };
      })
    );

    sounds.playNotify();
  };

  const addPaymentToOrder = (
    orderId: string,
    amount: number,
    _method: PaymentMethod,
    currentUser: User
  ) => {
    const now = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const newPaidAmount = o.paidAmount + amount;
        const newBalance = Math.max(0, o.total - newPaidAmount);
        const newPaymentStatus = newBalance === 0 ? 'paid' : newPaidAmount > 0 ? 'dp' : 'unpaid';

        // Update customer unpaid balance
        setCustomers((cPrev) =>
          cPrev.map((c) =>
            c.id === o.customerId
              ? {
                  ...c,
                  totalSpent: c.totalSpent + amount,
                  unpaidBalance: Math.max(0, c.unpaidBalance - amount),
                }
              : c
          )
        );

        return {
          ...o,
          paidAmount: newPaidAmount,
          balance: newBalance,
          paymentStatus: newPaymentStatus,
          updatedAt: now,
          timeline: [
            ...o.timeline,
            {
              id: `TL-${Date.now()}`,
              timestamp: now,
              status: o.status,
              user: currentUser.name,
              userRole: currentUser.role,
              note: `Pembayaran masuk tambahan: Rp ${amount.toLocaleString('id-ID')} (${newPaymentStatus === 'paid' ? 'LUNAS' : `Sisa Rp ${newBalance.toLocaleString('id-ID')}`})`,
            },
          ],
        };
      })
    );

    sounds.playSuccess();
  };

  const cancelOrder = (orderId: string, currentUser: User, reason?: string) => {
    updateOrderStatus(orderId, 'cancelled', currentUser, `Pesanan dibatalkan. Alasan: ${reason || 'Pembatalan oleh kasir/owner'}`);
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    sounds.playClick();
  };

  const clearAllOrders = () => {
    setOrders([]);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    sounds.playSuccess();
  };

  // Customer Actions
  const addCustomer = (
    customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'unpaidBalance' | 'createdAt'>
  ): Customer => {
    const newCust: Customer = {
      ...customer,
      id: `CUST-${Date.now().toString().slice(-4)}`,
      totalOrders: 0,
      totalSpent: 0,
      unpaidBalance: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  // Category Actions
  const addCategory = (categoryData: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...categoryData,
      id: `CAT-${Date.now().toString().slice(-4)}`,
      name: categoryData.name.toUpperCase().trim(),
    };
    setCategories((prev) => [...prev, newCat]);
    sounds.playSuccess();
  };

  const updateCategory = (updated: CategoryItem) => {
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...updated, name: updated.name.toUpperCase().trim() } : c)));
    sounds.playSuccess();
  };

  const deleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    sounds.playClick();
  };

  // Material Actions
  const addMaterial = (mat: Omit<MaterialItem, 'id'>) => {
    const newMat: MaterialItem = {
      ...mat,
      id: `MAT-${Date.now().toString().slice(-4)}`,
    };
    setMaterials((prev) => [...prev, newMat]);
  };

  const updateMaterial = (updated: MaterialItem) => {
    setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const deleteMaterial = (materialId: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
  };

  const bulkUpdateMaterials = (
    updates: { id: string; costPrice?: number; sellingPrice?: number; stock?: number; minStock?: number }[]
  ) => {
    const updateMap = new Map(updates.map((u) => [u.id, u]));
    setMaterials((prev) =>
      prev.map((m) => {
        const u = updateMap.get(m.id);
        if (!u) return m;
        return {
          ...m,
          ...(u.costPrice !== undefined ? { costPrice: u.costPrice } : {}),
          ...(u.sellingPrice !== undefined ? { sellingPrice: u.sellingPrice } : {}),
          ...(u.stock !== undefined ? { stock: u.stock } : {}),
          ...(u.minStock !== undefined ? { minStock: u.minStock } : {}),
        };
      })
    );
    sounds.playSuccess();
  };

  const bulkAddMaterials = (newItems: Omit<MaterialItem, 'id'>[]) => {
    const timestamp = Date.now();
    const created: MaterialItem[] = newItems.map((item, idx) => ({
      ...item,
      id: `MAT-${timestamp.toString().slice(-4)}-${idx + 1}`,
    }));
    setMaterials((prev) => [...prev, ...created]);
    sounds.playSuccess();
  };

  // Finishing Actions
  const addFinishing = (fin: Omit<FinishingItem, 'id'>) => {
    const newFin: FinishingItem = {
      ...fin,
      id: `FIN-${Date.now().toString().slice(-4)}`,
    };
    setFinishings((prev) => [...prev, newFin]);
  };

  const updateFinishing = (updated: FinishingItem) => {
    setFinishings((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const deleteFinishing = (finishingId: string) => {
    setFinishings((prev) => prev.filter((f) => f.id !== finishingId));
  };

  // Machine Actions
  const updateMachine = (updated: MachineItem) => {
    setMachines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  // Expense Actions
  const addExpense = (exp: Omit<Expense, 'id' | 'expenseNumber'>) => {
    const nextSeq = expenses.length + 1;
    const newExp: Expense = {
      ...exp,
      id: `EXP-${Date.now().toString().slice(-4)}`,
      expenseNumber: `KAS-OUT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(nextSeq).padStart(2, '0')}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    sounds.playClick();
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  // Purchase Order Actions
  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>): PurchaseOrder => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const nextSeq = purchaseOrders.length + 1;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `PO-${Date.now()}`,
      poNumber: `PO-${dateStr}-${String(nextSeq).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    sounds.playClick();
    return newPO;
  };

  const updatePurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders((prev) => prev.map((p) => (p.id === po.id ? { ...po, updatedAt: new Date().toISOString() } : p)));
    sounds.playClick();
  };

  const deletePurchaseOrder = (poId: string) => {
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== poId));
    sounds.playClick();
  };

  const receivePurchaseOrder = (poId: string) => {
    const targetPo = purchaseOrders.find((p) => p.id === poId);
    if (!targetPo) return;

    // Tambahkan stok pada bahan yang cocok
    setMaterials((prevMaterials) =>
      prevMaterials.map((mat) => {
        const item = targetPo.items.find(
          (it) => it.materialId === mat.id || it.itemName.toLowerCase().trim() === mat.name.toLowerCase().trim()
        );
        if (item) {
          // Jika item diukur per roll (misal flexi roll = 160 m²), tambahkan ke stok meter
          let addQty = item.qty;
          if (item.unit === 'roll' && (mat.unit === 'm²' || mat.unit === 'meter')) {
            addQty = item.qty * 160; // Standar 1 roll 3.2m x 50m = 160 m²
          }
          return {
            ...mat,
            stock: mat.stock + addQty,
          };
        }
        return mat;
      })
    );

    // Update status PO ke received
    updatePurchaseOrder({
      ...targetPo,
      status: 'received',
      receivedDate: new Date().toISOString(),
    });

    sounds.playSuccess();
  };

  // Settings
  const updateStoreSettings = (settings: StoreSettings) => {
    setStoreSettings(settings);
  };

  // Cashier Shift Actions
  const startShift = (openingCash: number, cashier: User, notes?: string): CashierShift => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const nextSeq = shifts.length + 1;
    const newShift: CashierShift = {
      id: `SHIFT-${Date.now()}`,
      shiftNumber: `SHIFT-${dateStr}-${String(nextSeq).padStart(2, '0')}`,
      cashierId: cashier.id,
      cashierName: cashier.name,
      startTime: new Date().toISOString(),
      status: 'open',
      openingCash,
      totalCashSales: 0,
      totalNonCashSales: 0,
      totalExpenses: 0,
      expectedCash: openingCash,
      notes,
      createdAt: new Date().toISOString(),
    };
    setShifts((prev) => [newShift, ...prev]);
    sounds.playSuccess();
    return newShift;
  };

  const closeShift = (shiftId: string, actualCash: number, closingNotes?: string): CashierShift => {
    const target = shifts.find((s) => s.id === shiftId);
    if (!target) throw new Error('Shift not found');

    const shiftStart = target.startTime;
    let totalCashSales = 0;
    let totalNonCashSales = 0;

    orders.forEach((o) => {
      if (o.createdAt >= shiftStart && o.paidAmount > 0) {
        if (o.paymentMethod === 'cash') {
          totalCashSales += o.paidAmount;
        } else {
          totalNonCashSales += o.paidAmount;
        }
      }
    });

    let totalExpenses = 0;
    expenses.forEach((e) => {
      if (e.date >= shiftStart && e.paymentMethod === 'cash') {
        totalExpenses += e.amount;
      }
    });

    const expectedCash = target.openingCash + totalCashSales - totalExpenses;
    const difference = actualCash - expectedCash;

    const closed: CashierShift = {
      ...target,
      endTime: new Date().toISOString(),
      status: 'closed',
      totalCashSales,
      totalNonCashSales,
      totalExpenses,
      expectedCash,
      actualCash,
      difference,
      closingNotes,
      updatedAt: new Date().toISOString(),
    };

    setShifts((prev) => prev.map((s) => (s.id === shiftId ? closed : s)));
    sounds.playSuccess();
    return closed;
  };

  // Production Bills
  const addProductionBill = (billData: Omit<ProductionBillItem, 'id' | 'billNumber' | 'createdAt'>) => {
    const seq = Math.floor(Math.random() * 900) + 100;
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const newBill: ProductionBillItem = {
      ...billData,
      id: `BILL-${Date.now()}`,
      billNumber: `TGH-${dateStr}-${seq}`,
      createdAt: new Date().toISOString(),
    };
    setProductionBills((prev) => [newBill, ...prev]);
    sounds.playSuccess();
    return newBill;
  };

  const updateProductionBill = (bill: ProductionBillItem) => {
    setProductionBills((prev) => prev.map((b) => (b.id === bill.id ? bill : b)));
    sounds.playSuccess();
  };

  const deleteProductionBill = (id: string) => {
    setProductionBills((prev) => prev.filter((b) => b.id !== id));
    sounds.playSuccess();
  };

  // Worker Debts
  const addWorkerDebt = (debtData: Omit<WorkerDebtItem, 'id' | 'debtNumber' | 'createdAt' | 'history'>) => {
    const seq = Math.floor(Math.random() * 900) + 100;
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const newDebt: WorkerDebtItem = {
      ...debtData,
      id: `DEBT-${Date.now()}`,
      debtNumber: `HTG-${dateStr}-${seq}`,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: `HIST-${Date.now()}`,
          date: new Date().toISOString(),
          amount: debtData.initialAmount,
          description: 'Pinjaman Kasbon Awal',
        },
      ],
    };
    setWorkerDebts((prev) => [newDebt, ...prev]);
    sounds.playSuccess();
    return newDebt;
  };

  const updateWorkerDebt = (debt: WorkerDebtItem) => {
    setWorkerDebts((prev) => prev.map((d) => (d.id === debt.id ? debt : d)));
    sounds.playSuccess();
  };

  const deleteWorkerDebt = (id: string) => {
    setWorkerDebts((prev) => prev.filter((d) => d.id !== id));
    sounds.playSuccess();
  };

  // Deduction Bridge: Deduct production bill from worker debt
  const deductBillFromDebt = (billId: string, debtId: string, amountToDeduct: number) => {
    const bill = productionBills.find((b) => b.id === billId);
    const debt = workerDebts.find((d) => d.id === debtId);

    if (!bill || !debt) {
      return { success: false, message: 'Data tagihan atau hutang tidak ditemukan!' };
    }

    if (amountToDeduct <= 0) {
      return { success: false, message: 'Nominal pemotongan harus lebih dari 0!' };
    }

    const actualDeduct = Math.min(amountToDeduct, debt.remainingAmount, bill.totalAmount);
    const newRemainingDebt = Math.max(0, debt.remainingAmount - actualDeduct);

    // 1. Update Worker Debt
    const historyEntry = {
      id: `HIST-${Date.now()}`,
      date: new Date().toISOString(),
      billId: bill.id,
      billTitle: bill.title,
      amount: actualDeduct,
      description: `Potong Tagihan Biaya: ${bill.title} (${bill.billNumber})`,
    };

    const updatedDebt: WorkerDebtItem = {
      ...debt,
      remainingAmount: newRemainingDebt,
      history: [historyEntry, ...debt.history],
    };

    // 2. Update Production Bill
    const updatedBill: ProductionBillItem = {
      ...bill,
      status: 'deducted',
      deductedFromDebtId: debt.id,
      deductedAmount: actualDeduct,
      paidAt: new Date().toISOString(),
      notes: bill.notes
        ? `${bill.notes} | Dipotong dari Kasbon ${debt.debtNumber} (${debt.workerName}) Rp ${actualDeduct.toLocaleString('id-ID')}`
        : `Dipotong dari Kasbon ${debt.debtNumber} (${debt.workerName}) Rp ${actualDeduct.toLocaleString('id-ID')}`,
    };

    setWorkerDebts((prev) => prev.map((d) => (d.id === debt.id ? updatedDebt : d)));
    setProductionBills((prev) => prev.map((b) => (b.id === bill.id ? updatedBill : b)));
    sounds.playSuccess();

    return {
      success: true,
      message: `Tagihan ${bill.billNumber} berhasil dipotong dari kasbon ${debt.workerName} sebesar Rp ${actualDeduct.toLocaleString('id-ID')}. Sisa hutang: Rp ${newRemainingDebt.toLocaleString('id-ID')}`,
    };
  };

  const payProductionBill = (billId: string, method: 'cash' | 'transfer', notes?: string) => {
    setProductionBills((prev) =>
      prev.map((b) => {
        if (b.id !== billId) return b;
        return {
          ...b,
          status: 'paid',
          paymentMethod: method,
          paidAt: new Date().toISOString(),
          notes: notes ? (b.notes ? `${b.notes} | ${notes}` : notes) : b.notes,
        };
      })
    );
    sounds.playSuccess();
  };

  const resetToDefaultData = () => {
    setOrders(initialOrders);
    setCustomers(initialCustomers);
    setMaterials(initialMaterials);
    setCategories(initialCategories);
    setFinishings(initialFinishing);
    setMachines(initialMachines);
    setExpenses(initialExpenses);
    setPurchaseOrders(initialPurchaseOrders);
    setShifts(initialShifts);
    setStoreSettings(initialStoreSettings);
    setProductionBills(initialProductionBills);
    setWorkerDebts(initialWorkerDebts);
    localStorage.clear();
    sounds.playSuccess();
  };

  return (
    <AppContext.Provider
      value={{
        orders,
        customers,
        materials,
        categories,
        finishings,
        machines,
        expenses,
        purchaseOrders,
        shifts,
        currentShift,
        storeSettings,
        productionBills,
        workerDebts,
        addProductionBill,
        updateProductionBill,
        deleteProductionBill,
        payProductionBill,
        addWorkerDebt,
        updateWorkerDebt,
        deleteWorkerDebt,
        deductBillFromDebt,
        startShift,
        closeShift,
        addOrder,
        updateOrder,
        updateOrderStatus,
        addPaymentToOrder,
        cancelOrder,
        deleteOrder,
        clearAllOrders,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        bulkUpdateMaterials,
        bulkAddMaterials,
        addCategory,
        updateCategory,
        deleteCategory,
        addFinishing,
        updateFinishing,
        deleteFinishing,
        updateMachine,
        addExpense,
        deleteExpense,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        receivePurchaseOrder,
        updateStoreSettings,
        resetToDefaultData,
        isDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
