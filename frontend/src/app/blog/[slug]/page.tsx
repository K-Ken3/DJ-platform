import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';

import { NavBar } from '@/components/site/NavBar';
import { SiteFooter } from '@/components/site/SiteFooter';
import { BACKEND_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  category?: string | null;
  published_at?: string | null;
};

async function getPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/blog/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.post || null;
    }
  } catch {
    // fall through
  }
  return null;
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <main className="min-h-screen">
        <NavBar />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold">Post not found</h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">This post may have been unpublished or removed.</p>
          <Link href="/#blog" className="btn-primary mt-8">
            Back to the blog
          </Link>
        </div>
      </main>
    );
  }

  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <main className="min-h-screen">
      <NavBar />

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
        <Link href="/#blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          All posts
        </Link>

        <header className="mt-8">
          {post.category && (
            <span className="pill pill-new">{post.category}</span>
          )}
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">{post.title}</h1>
          {published && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <CalendarDays className="h-4 w-4" />
              {published}
            </p>
          )}
        </header>

        {post.featured_image && (
          <div className="mt-8 overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <Image
              src={post.featured_image}
              alt={post.title}
              width={1200}
              height={675}
              className="h-72 w-full object-cover md:h-96"
            />
          </div>
        )}

        <div className="mt-8 max-w-none text-zinc-700 dark:text-zinc-300">
          {post.excerpt && (
            <p className="text-lg font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">{post.excerpt}</p>
          )}
          {(post.content || '').split('\n').map((paragraph, index) =>
            paragraph.trim() ? (
              <p key={index} className="mt-4 leading-relaxed">
                {paragraph.trim()}
              </p>
            ) : null
          )}
        </div>
      </article>

      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-extrabold">Heard something you love?</h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Request it live right now and it lands on the booth.</p>
          <Link href="/request/dj-vaxino" className="btn-primary mt-5">
            Request a Song
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}