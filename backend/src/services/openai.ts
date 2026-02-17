import OpenAI from 'openai';
import config from '../config/config';
import luisProfile from '../data/luis-profile.json';

// Creating openAi client
const openai = new OpenAI({
    apiKey: config.openaiApiKey,
});

// Cache the stringified profile to avoid repeated JSON.stringify
let cachedProfile: string | null = null;

const getGogginsModePrompt = (): string => {
  return `You're Goggins Mode — a ruthless, no-excuses motivator. Deliver brutal honesty, unrelenting discipline, and extreme ownership. Annihilate weakness, demand action, and embrace the grind. Keep responses raw, intense and soul-shaking paragraphs. Sign off: — Goggins Mode.`;
}

const buildProfileContext = (): string => {
  const p = luisProfile as any;
  const articles = (p.articles || []) as any[];
  const experience = (p.experience || []) as any[];
  const projects = (p.projects || []) as any[];
  const skills = p.skills || {};

  const bioSection = `## Bio
${p.name} — ${p.location}
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
${articles.map((a: any) => `- "${a.title}" (${a.published}) — ${a.summary} [Tech: ${(a.tech || []).join(', ')}]`).join('\n')}`;

  const skillsSection = `## Skills
- Languages: ${(skills.languages || []).join(', ')}
- Frameworks: ${(skills.frameworks || []).join(', ')}
- APIs: ${(skills.APIs || []).join(', ')}
- DevOps: ${(skills.devops || []).join(', ')}
- Databases: ${(skills.databases || []).join(', ')}
- Data/ML: ${(skills.data_ml || []).join(', ')}
- Methods: ${(skills.project_methods || []).join(', ')}`;

  const educationSection = `## Education & Certifications
${(p.education || []).map((e: any) => `- ${e.degree} — ${e.institution} (${e.years})`).join('\n')}
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
- Present Luis's career as a progression: agency TPM → healthcare software engineer → data analyst + Master's student, always building and shipping.
- Use markdown formatting for readability. Keep responses concise — short paragraphs, bullet points, no walls of text.
- If the user asks for code or technical advice, respond as Luis would based on his hands-on experience.
- If a question falls outside Luis's profile, say so honestly rather than guessing.`;
};

/**
 * Chat with AI using OpenAI's GPT models
 * @param prompt User's question
 * @param modelName Model to use (defaults to gpt-3.5-turbo)
 * @returns AI response
 */
export const chatWithAI = async (
    prompt: string, 
    modelName: string = 'gpt-3.5-turbo'
  ): Promise<string> => {
    try {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
  
      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error: any) {
      console.error('OpenAI API error:', error.message);
      throw new Error('Failed to get response from AI service');
    }
  };

  export const chatWithGogginsMode = async (
    prompt: string
  ): Promise<string> => {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: getGogginsModePrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
  
      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error: any) {
      console.error('OpenAI API error:', error.message);
      throw new Error('Failed to get response from AI service');
    }
  };
  
  export default openai;