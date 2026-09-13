import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Code, 
  GraduationCap, 
  Briefcase, 
  UserCheck, 
  Target, 
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';

/**
 * TemplatesScreen Component
 * Displays curated ready-to-use prompt templates categorized by task type.
 * Clicking "Use template" navigates to Chat and pre-fills the prompt into the composer.
 */
export default function TemplatesScreen({ onUseTemplate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    'Coding',
    'Writing',
    'Learning',
    'Business',
    'Career',
    'Marketing',
    'Productivity',
  ];

  const templates = [
    {
      id: 'resume-improvement',
      title: 'Resume Improvement',
      category: 'Career',
      icon: UserCheck,
      description: 'Build a stronger resume tailored for a specific job role with impact bullet points.',
      prompt: 'Review and improve my resume for a Senior Software Engineer position. Here are my current experience details:\n\n- Role: Software Engineer\n- Achievements: Improved API performance by 40%, built microservices in Python\n\nPlease suggest high-impact action verbs and quantified bullet points.',
      isFeatured: true,
    },
    {
      id: 'react-component',
      title: 'Build a React Component',
      category: 'Coding',
      icon: Code,
      description: 'Generate a production-ready React component with clean props, Tailwind/CSS styling, and state management.',
      prompt: 'Write a modern React component in JavaScript for a dashboard metric card. Include smooth hover animations, dark mode styling, and proper PropTypes/comments.',
      isFeatured: true,
    },
    {
      id: 'python-interview',
      title: 'Python Interview Prep',
      category: 'Learning',
      icon: GraduationCap,
      description: 'Prepare for Python technical interviews with coding questions and detailed explanations.',
      prompt: 'Act as a senior technical interviewer. Give me 3 intermediate-to-advanced Python interview questions covering data structures, memory management, and decorators. Include solutions and explanations.',
      isFeatured: true,
    },
    {
      id: 'professional-email',
      title: 'Professional Email',
      category: 'Writing',
      icon: FileText,
      description: 'Draft a polite, effective email for business communications, follow-ups, or inquiries.',
      prompt: 'Draft a professional and concise email to a project manager requesting a 2-day extension on a feature delivery deadline due to unexpected edge-case testing.',
    },
    {
      id: 'cover-letter',
      title: 'Cover Letter Generator',
      category: 'Career',
      icon: Briefcase,
      description: 'Draft a compelling cover letter highlighting your skills and passion for a target position.',
      prompt: 'Draft a persuasive 3-paragraph cover letter for a Full-Stack Developer position at an innovative tech startup. Emphasize problem-solving, React, and Python experience.',
    },
    {
      id: 'code-debugging',
      title: 'Code Debugging Assistant',
      category: 'Coding',
      icon: Code,
      description: 'Identify bugs, performance bottlenecks, and security vulnerabilities in your code.',
      prompt: 'Analyze the following code for bugs, edge cases, and performance bottlenecks. Explain what is wrong and provide the corrected code:\n\n```javascript\n// Paste code here\n```',
    },
    {
      id: 'meeting-summary',
      title: 'Meeting Summary & Action Items',
      category: 'Productivity',
      icon: Target,
      description: 'Transform raw meeting transcripts or notes into clean executive summaries and action items.',
      prompt: 'Summarize the following meeting notes into:\n1. Key Discussion Points\n2. Decisions Made\n3. Action Items with Assigned Owners\n\nNotes:\n[Paste notes here]',
    },
    {
      id: 'business-idea',
      title: 'Business Idea Evaluator',
      category: 'Business',
      icon: Zap,
      description: 'Evaluate a business concept with a SWOT analysis, target audience breakdown, and monetization model.',
      prompt: 'Analyze the following business concept:\n- Concept: An AI-powered personal time management assistant for freelancers\n\nProvide a SWOT analysis, target demographic breakdown, and 3 viable monetization strategies.',
    },
    {
      id: 'travel-planner',
      title: 'Travel Itinerary Planner',
      category: 'Productivity',
      icon: Sparkles,
      description: 'Create a custom day-by-day travel itinerary with local recommendations and dining spots.',
      prompt: 'Create a 7-day trip itinerary for Tokyo and Kyoto for a first-time traveler who loves technology, ramen, and historical temples. Include budget-friendly tips.',
    },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = activeCategory === 'All' || template.category === activeCategory;
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="nova-workspace-body templates-page-container">
      {/* Header */}
      <div className="templates-header">
        <div className="explore-badge">
          <Sparkles size={14} style={{ color: '#8b5cf6' }} />
          <span>PROMPT CATALOG</span>
        </div>
        <h1 className="explore-title">Templates</h1>
        <p className="explore-subtitle">Ready-to-use prompts for any task. Click to edit in composer before sending.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="templates-controls">
        <div className="templates-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="templates-search-input"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="templates-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="templates-grid">
        {filteredTemplates.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div key={tpl.id} className={`template-card ${tpl.isFeatured ? 'featured' : ''}`}>
              <div className="template-card-header">
                <div className="template-icon-badge">
                  <Icon size={18} />
                </div>
                <span className="template-category-tag">{tpl.category}</span>
              </div>

              <h3 className="template-title">{tpl.title}</h3>
              <p className="template-desc">{tpl.description}</p>

              <button
                className="btn-use-template"
                onClick={() => onUseTemplate && onUseTemplate(tpl.prompt)}
              >
                <span>Use template</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
