import React from 'react';
import { 
  Code2, 
  PenTool, 
  GraduationCap, 
  FileText, 
  Lightbulb, 
  BarChart3, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

/**
 * ExploreScreen Component
 * Displays NOVA's visual capability grid.
 * Clicking a capability card populates a starter prompt into the Chat composer.
 */
export default function ExploreScreen({ onSelectCapability }) {
  const capabilities = [
    {
      id: 'coding',
      title: 'Coding',
      category: 'DEVELOPMENT',
      description: 'Write, debug, explain and refactor code in Python, JavaScript, React, C++, SQL and more.',
      icon: Code2,
      color: '#38bdf8',
      starterPrompt: 'Help me write and debug a code script for: ',
    },
    {
      id: 'writing',
      title: 'Writing',
      category: 'CONTENT CREATION',
      description: 'Write, edit and improve emails, articles, cover letters, essays, and technical documentation.',
      icon: PenTool,
      color: '#8b5cf6',
      starterPrompt: 'Help me draft and polish content for: ',
    },
    {
      id: 'learning',
      title: 'Learning',
      category: 'EDUCATION',
      description: 'Understand complex scientific, mathematical, or technical concepts with step-by-step breakdowns.',
      icon: GraduationCap,
      color: '#6366f1',
      starterPrompt: 'Explain this concept in clear, simple terms with real-world examples: ',
    },
    {
      id: 'documents',
      title: 'Documents',
      category: 'ANALYSIS',
      description: 'Summarize long papers, extract key action items, and analyze text structure.',
      icon: FileText,
      color: '#ec4899',
      starterPrompt: 'Summarize the following text and extract key action items: ',
    },
    {
      id: 'brainstorming',
      title: 'Brainstorming',
      category: 'IDEATION',
      description: 'Generate creative business ideas, product names, project strategies, and problem solutions.',
      icon: Lightbulb,
      color: '#f97316',
      starterPrompt: 'Brainstorm creative ideas and innovative solutions for: ',
    },
    {
      id: 'analytics',
      title: 'Data & Analytics',
      category: 'INSIGHTS',
      description: 'Analyze data sets, write complex SQL queries, and interpret quantitative results.',
      icon: BarChart3,
      color: '#10b981',
      starterPrompt: 'Help me analyze this data set and write SQL queries for: ',
    },
  ];

  return (
    <div className="nova-workspace-body explore-page-container">
      {/* Explore Header */}
      <div className="explore-header">
        <div className="explore-badge">
          <Sparkles size={14} style={{ color: '#38bdf8' }} />
          <span>CAPABILITIES & WORKFLOWS</span>
        </div>
        <h1 className="explore-title">Explore NOVA</h1>
        <p className="explore-subtitle">Discover what you can create with your AI companion</p>
      </div>

      {/* Capability Grid */}
      <div className="explore-grid">
        {capabilities.map((cap) => {
          const Icon = cap.icon;
          return (
            <div
              key={cap.id}
              className="explore-card"
              onClick={() => onSelectCapability && onSelectCapability(cap.starterPrompt)}
            >
              <div className="explore-card-top">
                <div
                  className="explore-icon-wrapper"
                  style={{
                    backgroundColor: `${cap.color}15`,
                    borderColor: `${cap.color}35`,
                  }}
                >
                  <Icon size={22} style={{ color: cap.color }} />
                </div>
                <span className="explore-category">{cap.category}</span>
              </div>

              <div className="explore-card-body">
                <h3 className="explore-card-title">{cap.title}</h3>
                <p className="explore-card-desc">{cap.description}</p>
              </div>

              <div className="explore-card-footer">
                <span className="explore-action-text">Start workflow</span>
                <ArrowRight size={15} className="explore-arrow-icon" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
