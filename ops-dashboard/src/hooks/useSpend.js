import { useEffect, useState } from 'react';
import {
  getPersonalSpend,
  savePersonalSpend,
  newSpend,
  mergePersonalSpend,
} from '../store.js';

export function useSpend() {
  const [personalSpend, setPersonalSpend] = useState(() => getPersonalSpend());

  useEffect(() => {
    savePersonalSpend(personalSpend);
  }, [personalSpend]);

  const addSpend = (data) => setPersonalSpend((es) => [...es, newSpend(data)]);

  const updateSpend = (id, patch) =>
    setPersonalSpend((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const deleteSpend = (id) => setPersonalSpend((es) => es.filter((e) => e.id !== id));

  const importMergeSpend = (imported) =>
    setPersonalSpend((es) => mergePersonalSpend(es, imported));

  return { personalSpend, addSpend, updateSpend, deleteSpend, importMergeSpend };
}
