import Link from 'next/link';
import { OmGlyph } from '@/components/ui/Ornaments';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-temple-gradient flex items-center justify-center px-6 text-center">
      <div>
        <OmGlyph className="w-12 h-12 mx-auto text-maroon-700" />
        <h1 className="h-display text-5xl text-maroon-800 mt-4">Page not found</h1>
        <p className="text-maroon-900/90 mt-2 max-w-md">The path you followed does not exist.</p>
        <Link href="/" className="btn-primary mt-6">Return home</Link>
      </div>
    </div>
  );
}
