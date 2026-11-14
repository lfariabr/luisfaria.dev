import Anthropic from '@anthropic-ai/sdk';
import config from '../config/config';
import luisProfile from '../data/luis-profile.json';

// Created on first use: the key is optional while the chatbot is hidden, and the SDK
// throws at construction when it has no key.
let client: Anthropic | null = null;
const getClient = (): Anthropic => (client ??= new Anthropic({ apiKey: config.anthropicApiKey }));

// Cache the stringified profile to avoid repeated JSON.stringify
let cachedProfile: string | null = null;

const buildProfileContext = (): string => {
  const p = luisProfile as any;
  const articles = (p.articles || []) as any[];
  const experience = (p.experience || []) as any[];
  const projects = (p.projects || []) as any[];
  const skills = p.skills || {};

  const bioSection = `## Bio
${p.name} - ${p.location}
${p.summary}
Current focus: ${p.current_focus}
Languages spoken: ${Object.entries(p.languages || {}).map(([lang, level]) => `${lang} (${level})`).join(', ')}`;

  const experienceSection = `## Career Timeline
${experience.map((e: any) => {
  const details = e.achievements ? e.achievements.map((a: string) => `  - ${a}`).join('\n') : '';
  const clients = e.clients ? `  Clients: ${e.clients.join(', ')}` : '';
  return `- **${e.title}** at ${e.company} (${e.duration})${details ? '\n' + details : ''}${clients ? '\n' + clients : ''}`;
}).join('\n')}`;

  const projectsSection = `## Projects
${projects.map((proj: any) => `- **${proj.name}**: ${proj.description} Impact: ${proj.impact}`).join('\n')}`;

  const articlesSection = `## Published Articles (${articles.length} on dev.to)
${articles.map((a: any) => `- "${a.title}" (${a.published}) - ${a.summary} [Tech: ${(a.tech || []).join(', ')}]`).join('\n')}`;

  const skillsSection = `## Skills
- Languages: ${(skills.languages || []).join(', ')}
- Frameworks: ${(skills.frameworks || []).join(', ')}
- APIs: ${(skills.APIs || []).join(', ')}
- DevOps: ${(skills.devops || []).join(', ')}
- Databases: ${(skills.databases || []).join(', ')}
- Data/ML: ${(skills.data_ml || []).join(', ')}
- Methods: ${(skills.project_methods || []).join(', ')}`;

  const educationSection = `## Education & Certifications
${(p.education || []).map((e: any) => `- ${e.degree} - ${e.institution} (${e.years})`).join('\n')}
Certifications: ${(p.certifications || []).join(', ')}`;

  return [bioSection, experienceSection, projectsSection, articlesSection, skillsSection, educationSection].join('\n\n');
};

const getSystemPrompt = (): string => {
  if (!cachedProfile) {
    cachedProfile = buildProfileContext();
  }

  return `You are Luis Faria's personal AI assistant on his portfolio website (luisfaria.dev).

${cachedProfile}

## Instructions
- Answer questions about Luis's background, projects, articles, and skills using the profile above.
- When a question relates to a topic Luis has written about, reference the specific article by title and summarize its content.
- Present Luis's career as a progression: agency TPM → healthcare software engineer → education data/systems specialist + applied AI Master's work, always building and shipping.
- Use markdown formatting for readability. Keep responses concise - short paragraphs, bullet points, no walls of text.
- If the user asks for code or technical advice, respond as Luis would based on his hands-on experience.
- If a question falls outside Luis's profile, say so honestly rather than guessing.`;
};

const DECLINED_REPLY = 'Sorry, I can’t help with that one.';

/**
 * One Claude request: a system prompt and a single user turn.
 * Short, conversational replies, so effort is `low`. Thinking is on by default and
 * counts toward `max_tokens`, so the cap is generous. No sampling parameters: current
 * models reject a non-default `temperature`.
 */
const ask = async (system: string, prompt: string): Promise<string> => {
  try {
    const response = await getClient().messages.create({
      model: config.aiModel,
      max_tokens: 16000,
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: prompt }],
    });

    if (response.stop_reason === 'refusal') return DECLINED_REPLY;

    const text = response.content
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('')
      .trim();
    return text || 'Sorry, I could not generate a response.';
  } catch (error) {
    throw new Error('Failed to get response from AI service', { cause: error });
  }
};

/** Answer a visitor's question about Luis, grounded in his profile. */
export const chatWithAI = (prompt: string): Promise<string> => ask(getSystemPrompt(), prompt);
