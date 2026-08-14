import { ReactNode } from 'react';
import './globals.css';

type Props = {
  children: ReactNode;
};

// Next.js requires a root layout even if we have dynamic subpath routing.
// We simply pass children through so they can be handled by app/[locale]/layout.tsx.
export default function RootLayout({ children }: Props) {
  return children;
}
