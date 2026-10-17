const personalInfoSection = () => ({
  id: 'personal',
  title: 'Personal Information',
  fields: [
    { key: 'fullName', label: 'Full name', type: 'text', required: true, minLength: 2, maxLength: 100 },
    { key: 'age', label: 'Age', type: 'text', required: true, minLength: 1, maxLength: 3, placeholder: 'e.g. 21' },
    { key: 'location', label: 'Location', type: 'locationGroup', required: true },
    { key: 'javaUsername', label: 'Java Minecraft username', type: 'text', required: false, minLength: 3, maxLength: 16 },
    { key: 'bedrockUsername', label: 'Bedrock Minecraft username', type: 'text', required: false, minLength: 3, maxLength: 30 },
    { key: 'discordUsername', label: 'Discord username', type: 'text', required: true, minLength: 2, maxLength: 40 },
    { key: 'email', label: 'Email address', type: 'text', required: true, maxLength: 200, isEmail: true },
  ],
});

const experienceSection = (roleLabel) => ({
  id: 'experience',
  title: 'Experience',
  fields: [
    {
      key: 'priorServerExperience',
      label: 'Have you worked on a Minecraft server before?',
      type: 'radio',
      required: true,
      options: ['Yes', 'No'],
    },
    {
      key: 'priorServerDetails',
      label: `If yes, briefly describe the server(s) and your role as a ${roleLabel}.`,
      type: 'textarea',
      required: false,
      maxLength: 1000,
      placeholder: 'Leave blank if this is your first server.',
    },
  ],
});

const availabilitySection = {
  id: 'availability',
  title: 'Availability',
  fields: [
    {
      key: 'hoursPerWeek',
      label: 'Hours per week you can commit',
      type: 'radio',
      required: true,
      options: ['1–3 hours', '4–7 hours', '8–12 hours', '13+ hours'],
    },
    {
      key: 'preferredSchedule',
      label: 'Preferred days/times you tend to be active (optional)',
      type: 'textarea',
      required: false,
      maxLength: 400,
    },
  ],
};

const additionalInfoSection = {
  id: 'additional',
  title: 'Additional Information',
  fields: [
    {
      key: 'anythingElse',
      label: "Anything else you'd like us to know?",
      type: 'textarea',
      required: false,
      maxLength: 800,
    },
    {
      key: 'voluntaryConfirm',
      label:
        'I understand that this is a volunteer position and confirm my willingness to commit the time I selected above.',
      type: 'checkbox',
      required: true,
    },
    {
      key: 'dataConsent',
      label:
        'I consent to Minedrop International Network storing and using my personal information solely to evaluate this application. I understand my data will be kept confidential and will not be shared with third parties.',
      type: 'checkbox',
      required: true,
    },
  ],
};

export const applicationTypes = [
  {
    id: 'builder',
    label: 'Builder',
    shortDescription:
      'Design and construct high-quality builds for spawns, lobbies, and community projects.',
    icon: 'hammer',
    sections: [
      personalInfoSection(),
      experienceSection('builder'),
      {
        id: 'skills',
        title: 'Skills',
        fields: [
          {
            key: 'buildingExperience',
            label: 'Describe your building experience (styles, how long you\u2019ve been building, notable projects).',
            type: 'textarea',
            required: true,
            minLength: 40,
            maxLength: 1500,
          },
          {
            key: 'worldEditLevel',
            label: 'WorldEdit / FAWE experience level',
            type: 'select',
            required: true,
            options: ['None', 'Basic', 'Intermediate', 'Advanced'],
          },
          {
            key: 'customAssets',
            label: 'Do you work with custom assets or resource packs?',
            type: 'radio',
            required: true,
            options: ['Yes', 'No'],
          },
          {
            key: 'portfolioLinks',
            label: 'Links to your builds (images, videos, servers, or a portfolio)',
            type: 'textarea',
            required: true,
            minLength: 8,
            maxLength: 1000,
            placeholder: 'Paste one or more links, one per line.',
          },
        ],
      },
      {
        id: 'position-specific',
        title: 'Position-Specific Questions',
        fields: [
          {
            key: 'proudProject',
            label: 'Which project are you most proud of, and why?',
            type: 'textarea',
            required: true,
            minLength: 30,
            maxLength: 1200,
          },
          {
            key: 'newProjectApproach',
            label: 'How do you approach starting a new build project from a blank canvas?',
            type: 'textarea',
            required: true,
            minLength: 30,
            maxLength: 1200,
          },
          {
            key: 'spawnDesign',
            label: 'How would you design a unique spawn, lobby, or map for a server like ours?',
            type: 'textarea',
            required: true,
            minLength: 30,
            maxLength: 1200,
          },
          {
            key: 'whyJoin',
            label: 'Why do you want to join Minedrop as a builder?',
            type: 'textarea',
            required: true,
            minLength: 30,
            maxLength: 1000,
          },
          {
            key: 'whatMakesDifferent',
            label: 'What makes you different from other builder applicants?',
            type: 'textarea',
            required: false,
            maxLength: 800,
          },
        ],
      },
      availabilitySection,
      additionalInfoSection,
    ],
  },
  {
    id: 'developer',
    label: 'Developer',
    shortDescription:
      'Build and maintain plugins, datapacks, and backend tooling that keep the network running.',
    icon: 'code',
    sections: [
      personalInfoSection(),
      experienceSection('developer'),
      {
        id: 'skills',
        title: 'Skills',
        fields: [
          {
            key: 'programmingExperience',
            label: 'Describe your programming experience (languages, years, how you learned).',
            type: 'textarea',
            required: true,
            minLength: 40,
            maxLength: 1500,
          },
          {
            key: 'apisUsed',
            label: 'Which server APIs have you worked with?',
            type: 'checkboxGroup',
            required: true,
            options: ['Paper / Spigot', 'Velocity / BungeeCord', 'Fabric / Forge', 'Other'],
          },
          {
            key: 'databasesUsed',
            label: 'Which databases have you used?',
            type: 'checkboxGroup',
            required: true,
            options: ['MySQL', 'MongoDB', 'SQLite', 'PostgreSQL', 'None'],
          },
          {
            key: 'toolsUsed',
            label: 'What tools do you use day-to-day (IDE, build tools, version control)?',
            type: 'textarea',
            required: true,
            minLength: 10,
            maxLength: 500,
          },
        ],
      },
      {
        id: 'position-specific',
        title: 'Position-Specific Questions',
        fields: [
          {
            key: 'portfolioLinks',
            label: 'Links to your work (GitHub, plugin pages, demo videos, etc.)',
            type: 'textarea',
            required: true,
            minLength: 8,
            maxLength: 1000,
            placeholder: 'Paste one or more links, one per line.',
          },
          {
            key: 'proudProject',
            label: 'Which project are you most proud of, and why?',
            type: 'textarea',
            required: false,
            maxLength: 1200,
          },
          {
            key: 'lagDebugging',
            label: 'A production server is experiencing TPS drops. Walk through how you would diagnose and fix it.',
            type: 'textarea',
            required: true,
            minLength: 40,
            maxLength: 1500,
          },
          {
            key: 'whyJoin',
            label: 'Why do you want to join Minedrop as a developer?',
            type: 'textarea',
            required: true,
            minLength: 30,
            maxLength: 1000,
          },
          {
            key: 'whatMakesDifferent',
            label: 'What makes you different from other developer applicants?',
            type: 'textarea',
            required: false,
            maxLength: 800,
          },
        ],
      },
      availabilitySection,
      additionalInfoSection,
    ],
  },
];

export function getApplicationType(id) {
  return applicationTypes.find((t) => t.id === id) || null;
}

export function getAllFields(type) {
  return type.sections.flatMap((s) => s.fields);
}
