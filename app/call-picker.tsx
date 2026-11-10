'use client';

import { useRef } from 'react';

export default function CallPicker({ branches }: {
  branches: { id: string; address: string; phone: string; href: string }[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return <>
    <button type="button" className="button" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      Позвонить
    </button>
    <dialog ref={dialog} className="call-dialog panel" aria-labelledby="call-title">
      <h2 id="call-title" className="text-[2rem]">Выберите филиал</h2>
      <ul className="my-5 grid gap-2">
        {branches.map(({ id, address, phone, href }) => <li key={id}>
          <a className="button w-full flex-col items-start gap-1" href={href} data-ym-goal="phone_click">
            <span>{address}</span>
            <span className="font-normal">{phone}</span>
          </a>
        </li>)}
      </ul>
      <form method="dialog"><button type="submit" className="button">Закрыть</button></form>
    </dialog>
  </>;
}
