'use client';

import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, slugify } from '@/lib/api';
import type { BlogPost } from '@/lib/types';
import { Modal, ConfirmButton } from '../Modal';

const emptyForm = { title: '', slug: '', excerpt: '', content: '', featured_image: '', category: '' };

export function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api<{ posts: BlogPost[] }>('/api/admin/blog');
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSavingError('');
    setShowForm(true);
  }

  function openEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image: post.featured_image || '',
      category: post.category || '',
    });
    setSavingError('');
    setShowForm(true);
  }

  async function savePost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSavingError('');
    try {
      const payload = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt,
        content: form.content,
        featured_image: form.featured_image || null,
        category: form.category || null,
      };
      if (editingId) {
        await api(`/api/blog/${editingId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/api/blog', { method: 'POST', body: JSON.stringify({ ...payload, status: 'DRAFT' }) });
      }
      setShowForm(false);
      load();
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Could not save post.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(post: BlogPost) {
    await api(`/api/blog/${post.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }),
    });
    load();
  }

  async function deletePost(post: BlogPost) {
    await api(`/api/blog/${post.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {posts.filter((post) => post.status === 'PUBLISHED').length} published &middot; {posts.length} total
        </p>
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New post
        </button>
      </div>

      {loading ? (
        <div className="border border-zinc-200 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 font-semibold">No posts yet.</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Write your first blog post to share with visitors.</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{post.title}</p>
                  <span className={`pill ${post.status === 'PUBLISHED' ? 'pill-played' : 'pill-new'}`}>{post.status}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  /blog/{post.slug} &middot; {post.category || 'Uncategorized'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-outline btn-sm" onClick={() => togglePublish(post)}>
                  {post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </button>
                <button type="button" className="btn-outline btn-sm" onClick={() => openEdit(post)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <ConfirmButton onConfirm={() => deletePost(post)} label={`Delete "${post.title}"?`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit post' : 'New post'} wide>
        <form onSubmit={savePost} className="grid gap-4">
          <div>
            <label htmlFor="bp-title">Title</label>
            <input id="bp-title" type="text" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value, slug: saving ? current.slug : slugify(event.target.value) }))} placeholder="Post title" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bp-slug">Slug</label>
              <input id="bp-slug" type="text" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="my-post-slug" />
            </div>
            <div>
              <label htmlFor="bp-category">Category</label>
              <input id="bp-category" type="text" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Events, Tips, Gear..." />
            </div>
          </div>
          <div>
            <label htmlFor="bp-excerpt">Short description</label>
            <textarea id="bp-excerpt" rows={2} value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} placeholder="A one-liner shown on the blog card." />
          </div>
          <div>
            <label htmlFor="bp-content">Full content</label>
            <textarea id="bp-content" rows={8} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Write your post. Blank lines become paragraphs." />
          </div>
          <div>
            <label htmlFor="bp-image">Featured image URL</label>
            <input id="bp-image" type="url" value={form.featured_image} onChange={(event) => setForm((current) => ({ ...current, featured_image: event.target.value }))} placeholder="https://..." />
          </div>

          {savingError && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{savingError}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save post'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}