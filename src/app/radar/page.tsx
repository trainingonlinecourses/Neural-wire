import { redirect } from 'next/navigation';

export const metadata = { title: 'AI Pulse — NEURALWIRE' };

/** The WorldMonitor radar was replaced by the desk's own AI Pulse panel. */
export default function RadarPage() {
  redirect('/pulse');
}
