import { useState, useEffect, useCallback } from 'react';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, writeBatch, getDocs, where,
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// ─── Products ──────────────────────────────────────────────────────────────
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addProduct = useCallback(async (data) => {
    return await addDoc(collection(db, 'products'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const updateProduct = useCallback(async (id, data) => {
    await updateDoc(doc(db, 'products', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await deleteDoc(doc(db, 'products', id));
  }, []);

  return { products, loading, addProduct, updateProduct, deleteProduct };
}

// ─── Customers ─────────────────────────────────────────────────────────────
export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addCustomer = useCallback(async (data) => {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  }, []);

  const updateCustomer = useCallback(async (id, data) => {
    await updateDoc(doc(db, 'customers', id), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    const batch = writeBatch(db);
    const pSnap = await getDocs(
      query(collection(db, 'purchases'), where('customer_id', '==', id))
    );
    pSnap.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'customers', id));
    await batch.commit();
  }, []);

  return { customers, loading, addCustomer, updateCustomer, deleteCustomer };
}

// ─── Purchases — exact Firestore field structure ────────────────────────────
// Fields stored in Firestore:
//   created_by        (string) — uid
//   created_by_email  (string)
//   customer_id       (string)
//   customer_name     (string)
//   product_data      (string) — JSON-stringified array of
//                       { product_id, name, price, quantity, subtotal }
//   purchase_date     (string) — ISO string e.g. "2026-02-09T05:40:29.646Z"
//   status            (string) — "pending" | "paid"
//   total_amount      (number)
export function usePurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'purchases'), orderBy('purchase_date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPurchases(
        snap.docs.map((d) => {
          const data = d.data();
          // product_data is stored as a JSON string — parse it for in-app use
          let productData = [];
          try {
            productData = data.product_data ? JSON.parse(data.product_data) : [];
          } catch {
            productData = [];
          }
          return {
            id: d.id,
            created_by: data.created_by,
            created_by_email: data.created_by_email,
            customer_id: data.customer_id,
            customer_name: data.customer_name,
            product_data: productData,          // parsed array for UI
            product_data_raw: data.product_data, // original JSON string
            purchase_date: data.purchase_date,
            status: data.status,
            total_amount: data.total_amount,
          };
        })
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const addPurchase = useCallback(async ({ customer_id, customer_name, items, total_amount, status, purchase_date }) => {
    const user = auth.currentUser;

    // Store product_data as JSON string — exactly matching Firestore structure
    const product_data = JSON.stringify(
      items.map((item) => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }))
    );

    return await addDoc(collection(db, 'purchases'), {
      created_by: user?.uid ?? 'unknown',
      created_by_email: user?.email ?? 'unknown',
      customer_id,
      customer_name,
      product_data,                                    // JSON string
      purchase_date: purchase_date ?? new Date().toISOString(),
      status: status ?? 'pending',
      total_amount,                                    // number
    });
  }, []);

  const updatePurchase = useCallback(async (id, updates) => {
    const payload = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.total_amount !== undefined) payload.total_amount = updates.total_amount;
    if (updates.customer_name !== undefined) payload.customer_name = updates.customer_name;
    if (updates.purchase_date !== undefined) payload.purchase_date = updates.purchase_date;
    if (updates.product_data !== undefined) {
      // Accept either parsed array or raw string
      payload.product_data = Array.isArray(updates.product_data)
        ? JSON.stringify(updates.product_data)
        : updates.product_data;
    }
    await updateDoc(doc(db, 'purchases', id), payload);
  }, []);

  const deletePurchase = useCallback(async (id) => {
    await deleteDoc(doc(db, 'purchases', id));
  }, []);

  // Deletes ALL purchases belonging to a given customer, but leaves the
  // customer document itself untouched.
  const deletePurchasesByCustomer = useCallback(async (customerId) => {
    const pSnap = await getDocs(
      query(collection(db, 'purchases'), where('customer_id', '==', customerId))
    );
    if (pSnap.empty) return;
    const batch = writeBatch(db);
    pSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }, []);

  return { purchases, loading, addPurchase, updatePurchase, deletePurchase, deletePurchasesByCustomer };
}
