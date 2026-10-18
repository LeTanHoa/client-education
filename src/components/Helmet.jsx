import React, { useEffect } from 'react';

const DEFAULT_TITLE = 'H - Nền Tảng Học Tập Tiểu Học';
const DEFAULT_DESCRIPTION = 'H - Nền tảng học tập trực tuyến vui nhộn, bổ ích dành cho học sinh tiểu học.';

export function updateMeta(name, content, attr = 'name') {
  if (typeof document === 'undefined' || !content) return;
  let element = document.querySelector(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function updateTitle(title) {
  if (typeof document === 'undefined') return;
  const formatted = title ? (title.includes('H') ? title : `${title} | H`) : DEFAULT_TITLE;
  document.title = formatted;
  updateMeta('og:title', formatted, 'property');
}

export function useHelmet({ title, description, keywords, ogImage } = {}) {
  useEffect(() => {
    if (title) updateTitle(title);
    if (description) {
      updateMeta('description', description, 'name');
      updateMeta('og:description', description, 'property');
    }
    if (keywords) {
      updateMeta('keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords, 'name');
    }
    if (ogImage) {
      updateMeta('og:image', ogImage, 'property');
    }
  }, [title, description, keywords, ogImage]);
}

export default function Helmet({ title, description, keywords, ogImage, children }) {
  useEffect(() => {
    let resolvedTitle = title;
    let resolvedDesc = description;
    let resolvedKeywords = keywords;
    let resolvedOgImage = ogImage;

    if (children) {
      React.Children.forEach(children, child => {
        if (!child) return;
        if (child.type === 'title' && typeof child.props?.children === 'string') {
          resolvedTitle = child.props.children;
        } else if (child.type === 'meta') {
          const name = child.props?.name;
          const property = child.props?.property;
          const content = child.props?.content;
          if (name === 'description' || property === 'og:description') resolvedDesc = content;
          if (name === 'keywords') resolvedKeywords = content;
          if (property === 'og:image') resolvedOgImage = content;
          if (name && content) updateMeta(name, content, 'name');
          if (property && content) updateMeta(property, content, 'property');
        }
      });
    }

    if (resolvedTitle) updateTitle(resolvedTitle);
    if (resolvedDesc) {
      updateMeta('description', resolvedDesc, 'name');
      updateMeta('og:description', resolvedDesc, 'property');
    }
    if (resolvedKeywords) {
      updateMeta('keywords', Array.isArray(resolvedKeywords) ? resolvedKeywords.join(', ') : resolvedKeywords, 'name');
    }
    if (resolvedOgImage) {
      updateMeta('og:image', resolvedOgImage, 'property');
    }
  }, [title, description, keywords, ogImage, children]);

  return null;
}

