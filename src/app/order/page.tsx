// This page is now deprecated. The multi-step order form is now at the homepage (/).
// Optionally, you can redirect this page to the homepage or show a notice.

import { redirect } from 'next/navigation';

export default function DeprecatedOrderPage() {
  redirect('/');
  return null;
}

