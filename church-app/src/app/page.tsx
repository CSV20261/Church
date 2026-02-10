import { redirect } from 'next/navigation';

// =====================================================
// ROOT PAGE - REDIRECTS TO DASHBOARD
// Users land here and are redirected to /dashboard
// which then routes them based on their role
// =====================================================
export default function HomePage() {
  redirect('/dashboard');
}
