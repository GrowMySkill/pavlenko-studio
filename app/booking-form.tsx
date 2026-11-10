'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ANY_MASTER, maskPhone, slotsFor, studioClock } from '../lib/booking';
import { reachGoal } from './metrika';
import type { Branch } from '../lib/studio';

type Options = {
  branches: Pick<Branch, 'id' | 'address' | 'hours'>[];
  categories: { name: string; items: { id: string; name: string; branchIds: string[] }[] }[];
  masters: { id: string; name: string; branchIds: string[]; serviceIds: string[] }[];
  timezone: string;
  privacyTitle: string;
  demo: boolean;
};

export default function BookingForm({ branches, categories, masters, timezone, privacyTitle, demo }: Options) {
  const [clock, setClock] = useState<ReturnType<typeof studioClock> | null>(null);
  const [branchId, setBranchId] = useState(branches.length === 1 ? branches[0].id : '');
  const [serviceId, setServiceId] = useState('');
  const [masterId, setMasterId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const branch = branches.find(({ id }) => id === branchId);
  const groups = categories.map(({ name, items }) => ({
    name, items: items.filter(({ branchIds }) => !branchId || branchIds.includes(branchId)),
  })).filter(({ items }) => items.length);
  const availableMasters = masters.filter(({ branchIds, serviceIds }) =>
    branchIds.includes(branchId) && (!serviceIds.length || serviceIds.includes(serviceId)));
  const slots = branch && clock ? slotsFor(branch.hours, date, clock) : [];

  function selectBranch(nextId: string) {
    setBranchId(nextId);
    const service = categories.flatMap(({ items }) => items).find(({ id }) => id === serviceId);
    if (service && !service.branchIds.includes(nextId)) {
      setServiceId('');
      setMasterId('');
    } else if (masterId && !availableMasters.some(({ id, branchIds }) => id === masterId && branchIds.includes(nextId))) {
      setMasterId('');
    }
    setTime('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demo || state === 'pending') return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setError('');
    setState('pending');
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId, serviceId, masterId, date, time,
          name: fields.get('name'), phone: '+' + phone.replace(/\D/g, ''),
          consent: fields.has('consent'), website: fields.get('website'),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setError(result.error || 'Не удалось отправить заявку. Попробуйте ещё раз.');
        setState('error');
        return;
      }
      form.reset();
      setServiceId('');
      setMasterId('');
      setDate('');
      setTime('');
      setPhone('');
      setState('success');
      reachGoal('booking_submit');
    } catch {
      setError('Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз.');
      setState('error');
    }
  }

  return <form className="panel mt-7" onSubmit={submit}>
    {demo && <p className="mb-5 text-sm">В демоверсии можно заполнить форму. Отправка заявки недоступна.</p>}
    <fieldset disabled={state === 'pending'} className="min-w-0">
      <legend className="sr-only">Данные заявки</legend>
      <div className="form-grid">
        <label>Услуга
          <select name="serviceId" required value={serviceId} onChange={(event) => {
            setServiceId(event.target.value);
            setMasterId('');
          }}>
            <option value="">Выберите услугу</option>
            {groups.map(({ name, items }) => <optgroup key={name} label={name}>
              {items.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </optgroup>)}
          </select>
        </label>
        <fieldset className="branch-options">
          <legend>Филиал</legend>
          <div className="branch-options-list">
            {branches.map(({ id, address }) => <label className="branch-option" key={id}>
              <input type="radio" name="branchId" value={id} checked={branchId === id} required
                onChange={() => selectBranch(id)} />
              <span>{address}</span>
            </label>)}
          </div>
        </fieldset>
        {availableMasters.length > 0 && <label>Мастер <span className="font-normal">(по желанию)</span>
          <select name="masterId" value={masterId} onChange={(event) => setMasterId(event.target.value)}>
            <option value="">{ANY_MASTER}</option>
            {availableMasters.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>}
        <label>Дата
          <input type="date" name="date" required min={clock?.date} value={date}
            onFocus={() => setClock(studioClock(timezone))}
            onChange={(event) => {
              setClock(studioClock(timezone));
              setDate(event.target.value);
              setTime('');
            }} />
        </label>
        <label>Время
          <select name="time" required disabled={!slots.length} value={time} onChange={(event) => setTime(event.target.value)}>
            <option value="">{!branch ? 'Сначала выберите филиал' : !date ? 'Сначала выберите дату' : slots.length ? 'Выберите время' : 'На эту дату нет доступного времени'}</option>
            {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
        </label>
      </div>
      <fieldset className="contact-fields form-grid mt-6">
        <legend>Ваши контакты</legend>
        <label>Имя
          <input name="name" autoComplete="given-name" required minLength={2} maxLength={100} />
        </label>
        <label>Телефон
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required
            value={phone} onChange={(event) => setPhone(maskPhone(event.target.value))}
            pattern={String.raw`\+7 \([0-9]{3}\) [0-9]{3}-[0-9]{2}-[0-9]{2}`} placeholder="+7 (___) ___-__-__" />
        </label>
      </fieldset>
      <div className="sr-only" aria-hidden="true">
        <label>Оставьте поле пустым<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 py-1 text-sm">
        <input name="consent" type="checkbox" required className="size-6 shrink-0 accent-[var(--action)]" />
        Согласен на обработку персональных данных
      </label>
      <Link href="/privacy" className="ml-9 inline-flex min-h-11 items-center text-sm underline">{privacyTitle}</Link>
    </fieldset>
    <div className="actions mt-6">
      <button type="submit" className="button button-primary" disabled={demo || state === 'pending' || !time || !slots.includes(time)}>
        {state === 'pending' ? 'Отправляем…' : 'Отправить заявку'}
      </button>
      {!demo && <p className="text-sm">Это заявка, администратор подтвердит запись</p>}
    </div>
    <p role="status" className={state === 'success' ? 'mt-4 rounded bg-[var(--note)] p-3' : 'sr-only'}>
      {state === 'success' && 'Заявка отправлена. Администратор свяжется с вами, чтобы подтвердить запись.'}
    </p>
    <p role="alert" className={state === 'error' ? 'mt-4 font-semibold' : 'sr-only'}>{error}</p>
  </form>;
}
