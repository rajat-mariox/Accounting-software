import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, SearchIcon } from './icons';
import { helpTopics, helpSupport } from '../../data/helpDocs';

function matchesQuery(topic, query) {
  if (!query) return true;
  const haystack = [
    topic.label,
    topic.summary,
    ...topic.sections.flatMap((section) => [
      section.heading,
      ...(section.steps || []),
      ...(section.faqs || []).flatMap((faq) => [faq.question, faq.answer]),
      ...(section.shortcuts || []).flatMap((shortcut) => [
        shortcut.description,
        ...(shortcut.keys || []),
      ]),
    ]),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function HelpDocsModal({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(helpTopics[0].id);
  const articleRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && articleRef.current) {
      articleRef.current.scrollTop = 0;
    }
  }, [activeId, open]);

  const filteredTopics = useMemo(
    () => helpTopics.filter((topic) => matchesQuery(topic, query)),
    [query],
  );

  const activeTopic =
    helpTopics.find((topic) => topic.id === activeId) || helpTopics[0];

  if (!open) return null;

  return createPortal(
    <div className="help-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="help-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="help-modal__header">
          <div>
            <h2 id="help-modal-title">Help &amp; Documentation</h2>
            <p>Guides, shortcuts, and answers for the Jubba ERP workspace.</p>
          </div>
          <button
            type="button"
            className="help-modal__close"
            onClick={onClose}
            aria-label="Close help"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="help-modal__body">
          <aside className="help-modal__sidebar">
            <label className="help-modal__search">
              <SearchIcon />
              <input
                type="search"
                value={query}
                placeholder="Search docs"
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search documentation"
              />
            </label>

            <nav className="help-modal__topics" aria-label="Documentation topics">
              {filteredTopics.length === 0 ? (
                <p className="help-modal__empty">No topics match “{query}”.</p>
              ) : (
                filteredTopics.map((topic) => {
                  const isActive = topic.id === activeTopic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      className={`help-modal__topic${
                        isActive ? ' help-modal__topic--active' : ''
                      }`}
                      onClick={() => setActiveId(topic.id)}
                    >
                      <strong>{topic.label}</strong>
                      <span>{topic.summary}</span>
                    </button>
                  );
                })
              )}
            </nav>
          </aside>

          <article className="help-modal__article" ref={articleRef}>
            <h3>{activeTopic.label}</h3>
            <p className="help-modal__article-summary">{activeTopic.summary}</p>

            {activeTopic.sections.map((section) => (
              <section key={section.heading} className="help-modal__section">
                <h4>{section.heading}</h4>

                {section.steps ? (
                  <ol className="help-modal__steps">
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : null}

                {section.shortcuts ? (
                  <ul className="help-modal__shortcuts">
                    {section.shortcuts.map((shortcut) => (
                      <li key={shortcut.description}>
                        <span className="help-modal__shortcut-keys">
                          {shortcut.keys.map((key) => (
                            <kbd key={key}>{key}</kbd>
                          ))}
                        </span>
                        <span>{shortcut.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.faqs ? (
                  <div className="help-modal__faqs">
                    {section.faqs.map((faq) => (
                      <details key={faq.question} className="help-modal__faq">
                        <summary>{faq.question}</summary>
                        <p>{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </article>
        </div>

        <footer className="help-modal__support">
          <div>
            <strong>Still need help?</strong>
            <p>Our support team is available {helpSupport.hours}.</p>
          </div>
          <div className="help-modal__support-links">
            <a href={`mailto:${helpSupport.email}`}>{helpSupport.email}</a>
            <a href={`tel:${helpSupport.phone.replace(/[^+\d]/g, '')}`}>
              {helpSupport.phone}
            </a>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
