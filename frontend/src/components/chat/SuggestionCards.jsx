import React from 'react';
import { Lightbulb, Code, FileText, Edit3, ArrowRight } from 'lucide-react';

/**
 * SuggestionCards Component (Compact SaaS Scale)
 * 4 feature cards across 1 row on desktop, 88px height, 15px title, 12px subtitle.
 */
export default function SuggestionCards({ onSelectPrompt }) {
  const cards = [
    {
      id: 'concept',
      icon: Lightbulb,
      title: 'Explain a concept',
      subtitle: 'in simple terms',
      prompt: 'Explain a complex concept in simple terms with an everyday analogy.',
      color: '#f59e0b',
    },
    {
      id: 'code',
      icon: Code,
      title: 'Write code',
      subtitle: 'for your idea',
      prompt: 'Write clean code for my idea with clear explanations.',
      color: '#38bdf8',
    },
    {
      id: 'summarize',
      icon: FileText,
      title: 'Summarize text',
      subtitle: 'quickly and clearly',
      prompt: 'Summarize text quickly and clearly into key takeaways.',
      color: '#a855f7',
    },
    {
      id: 'brainstorm',
      icon: Edit3,
      title: 'Brainstorm ideas',
      subtitle: 'get inspired',
      prompt: 'Help me brainstorm innovative ideas and creative strategies.',
      color: '#ec4899',
    },
  ];

  return (
    <div className="suggestion-cards-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="shortcut-card"
            onClick={() => onSelectPrompt(card.prompt)}
          >
            <div className="card-left">
              <div className="card-icon-box" style={{ color: card.color, backgroundColor: `${card.color}15` }}>
                <Icon size={16} />
              </div>
              <div className="card-text">
                <span className="card-title">{card.title}</span>
                <span className="card-subtitle">{card.subtitle}</span>
              </div>
            </div>
            <ArrowRight size={14} className="card-arrow" />
          </div>
        );
      })}
    </div>
  );
}
