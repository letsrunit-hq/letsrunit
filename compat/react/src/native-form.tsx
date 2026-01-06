import { useState } from 'react';

export function NativeForm() {
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const [select, setSelect] = useState('');
  const [date, setDate] = useState('');

  return (
    <form>
      <label htmlFor="text">Text</label>
      <input id="text" value={text} onChange={(e) => setText(e.target.value)} />

      <label htmlFor="check">Agree</label>
      <input id="check" type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />

      <label htmlFor="select">Country</label>
      <select id="select" value={select} onChange={(e) => setSelect(e.target.value)}>
        <option value="">--</option>
        <option value="NL">Netherlands</option>
        <option value="DE">Germany</option>
      </select>

      <label htmlFor="date">Date</label>
      <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
    </form>
  );
}
