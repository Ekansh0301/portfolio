export const profile = {
  first: "EKANSH",
  last: "GOYAL",
  eyebrow: "Turning Research Into Systems.",
  tagline: "Engineering Intelligence That Holds Up.",
  blurb:
    "NLP researcher & systems engineer building distributed infrastructure, deep-learning pipelines, and interfaces that feel inevitable.",
  email: "ekansh0301@gmail.com",
  phone: "+91 6350353130",
  location: "IIIT Hyderabad, India",
  availability: "Open to SWE and ML roles",
} as const;

/**
 * Contact form delivery. Fill in ONE of these and the form starts sending for
 * real; leave both empty and it falls back to opening a mail draft, which is
 * not a delivery mechanism you should rely on.
 *
 *   web3formsKey  Easiest. Put your address into https://web3forms.com,
 *                 they email you an access key, paste it here. No account.
 *   endpoint      A Formspree / Getform / Basin form URL, if you prefer one
 *                 of those, e.g. "https://formspree.io/f/xxxxxxxx".
 */
export const contactForm = {
  web3formsKey: "abc96a1e-45a2-496f-ba9c-2446ad8e9e94",
  endpoint: "",
};

export const socials = [
  { label: "GitHub", href: "https://github.com/Ekansh0301", icon: "github" },
  { label: "LinkedIn", href: "https://linkedin.com/in/ekanshgoyal-cs", icon: "linkedin" },
  { label: "Email", href: "mailto:ekansh0301@gmail.com", icon: "mail" },
] as const;

export type Project = {
  title: string;
  short: string;
  blurb: string;
  stack: string[];
  href?: string;
  video?: string;
  metric: string;
  demo: "ring" | "critics" | "voice" | "cipher" | "eye" | "futures";
  hint: string;
};

export const projects: Project[] = [
  {
    title: "QuorumKV",
    short:
      "Masterless DynamoDB-style store: gossip, a consistent hash ring, N/R/W quorums, vector clocks, hinted handoff and Merkle anti-entropy.",
    blurb:
      "A masterless, DynamoDB-inspired key-value store. Peers gossip over a 128-bit consistent hash ring with virtual nodes, while tunable N/R/W quorums, vector clocks, hinted handoff and Merkle-tree anti-entropy keep it available straight through a partition.",
    stack: ["Python", "Redis", "Gossip"],
    href: "https://github.com/Ekansh0301/QuorumKV",
    metric: "Survives node failure",
    demo: "ring",
    hint: "Kill a node, then write a key.",
  },
  {
    title: "The Director LLM",
    short:
      "Four critics score narrative, causality, world and voice. An intent-conditioned weighting decides which one leads each turn.",
    blurb:
      "Multi-critic reinforcement learning for interactive narrative. Four independently trained critics score narrative quality, causal consistency, world coherence and character voice, and an intent-conditioned weighting function decides which one should dominate each turn.",
    stack: ["PyTorch", "PPO", "QLoRA"],
    href: "https://github.com/Ekansh0301/Dropout-Squad",
    metric: "+48.3% over supervised baseline",
    demo: "critics",
    hint: "Pick the player's intent.",
  },
  {
    title: "Vox",
    short:
      "Hold a key, talk, let go. Opens apps, runs commands, reads your screen and answers aloud, fully offline on a 4 GB GPU.",
    blurb:
      "Hold a key, talk, let go. Vox opens apps and links, runs shell commands, writes files, reads whatever is on your screen, and answers in a voice of its own. All of it happens on a 4 GB laptop GPU, so there is no subscription, no API key, and nothing leaves the machine.",
    stack: ["Ollama", "Whisper", "Piper"],
    href: "https://github.com/Ekansh0301/Voxd",
    metric: "Fully offline, no API keys",
    demo: "voice",
    hint: "Replay one voice command.",
  },
  {
    title: "CryptoStack",
    short:
      "Twenty cryptographic primitives from first principles on the Python standard library, with a dashboard built to break each one.",
    blurb:
      "Twenty cryptographic primitives written from first principles on the Python standard library alone, from one-way functions up to 2-party MPC via oblivious transfer, behind a 50-endpoint API and a dashboard built to let you break each one.",
    stack: ["FastAPI", "React", "Cryptography"],
    href: "https://github.com/Ekansh0301/CryptoStack",
    metric: "20 primitives, stdlib only",
    demo: "cipher",
    hint: "Flip one bit of the input.",
  },
  {
    title: "Anemia Detection",
    short:
      "Photograph the inner eyelid, get a haemoglobin estimate and anaemia severity. Quality gate, UNet++ segmentation, and a 1.5 MB quantized model that runs on the phone.",
    blurb:
      "Non-invasive anaemia screening for places without a lab, built by a team of five for SDG3 Health. A guide box frames the capture, an image-quality gate rejects blurry or dark photos, UNet++ isolates the palpebral conjunctiva, and a quantized on-device model estimates haemoglobin and classifies severity. Doctors register patients with Aadhaar OCR and track each patient's readings over time.",
    stack: ["UNet++", "ONNX Runtime", "React Native"],
    metric: "94% Dice · 1.5 MB on-device",
    demo: "eye",
    hint: "Spoil the photo, then rescue it.",
  },
  {
    title: "Foresight",
    short:
      "Crash-test every recommendation before the client signs. Foresight reads a family's statements into a digital twin, runs a recommendation and its alternatives through the same 10,000 futures, explains the winner in dollars, and writes a file a regulator can replay. Six decisions, a market monitor for who to call when markets fall, supervision tools, and an MCP server for AI agents.",
    blurb:
      "Foresight is a decision layer for financial advisors and the principals who supervise them: a digital twin of the household, a paired comparison on identical futures, a cause-by-cause Value Bridge, and a replayable Best-Interest File. First prize at LPL WealthX 2026, with Krishna and Devansh.",
    stack: ["Python", "NumPy", "FastAPI", "Next.js", "MCP"],
    metric: "First prize · LPL WealthX 2026",
    video: "https://youtu.be/DF43X6l2lD0",
    demo: "futures",
    hint: "Same futures, two options.",
  },
];

export const publications = [
  {
    title: "An Interpretable Linguistically-Grounded Analysis of Scene Saliency in Movie Screenplays",
    venue: "EMNLP 2026, Main Conference",
    status: "Published",
    detail:
      "LGSM is a dual-stream model: a frozen BERT encoder on one side, an explicit stream of psycholinguistic and discourse features on the other, and adaptive gating that learns how far to trust each one scene by scene. Recall on salient scenes rises from 51.6% to 68.3%, and summaries built on its output gain +3.67 ROUGE-1.",
  },
  {
    title: "Truth Gradient at SemEval-2026 Task 10: Mean Pooling and Narrative Density for Conspiracy Belief Detection",
    venue: "SemEval-2026, Task 10",
    status: "Sole author",
    href: "https://github.com/Ekansh0301/conspiracy-belief-detection",
    detail:
      "Whether the author of a Reddit post actually believes a conspiracy, or is only recounting one. The paper names the signal narrative density: believers spread conspiratorial framing across an entire post instead of into a few tell-tale words, a gap that holds with a large effect size. 0.829 macro F1 on development, 0.75 on the official test set.",
  },
];

export const experience = [
  {
    period: "May 2025 - Present",
    org: "LTRC · IIIT Hyderabad",
    role: "Undergraduate Researcher",
    advisor: "Prof. Rajakrishnan Rajkumar",
    summary: "Deep-learning NLP on narrative and belief.",
    points: [
      "First author, SemEval-2026 conspiracy-belief paper",
      "Led the EMNLP 2026 scene-saliency paper (+16% F1)",
      "Reproducible experiment tooling: 40% faster iteration",
      "TA, Computational Linguistics II (commended)",
    ],
    tags: ["PyTorch", "Transformers", "SHAP"],
  },
  {
    period: "May - June 2025",
    org: "Sanwariya Ji Synthetics",
    role: "Software Engineer Intern",
    advisor: "Industry internship",
    summary: "Automated a legacy inventory workflow.",
    points: [
      "YOLO and PaddleOCR digitize handwritten records",
      "Clean SQL schema, no manual-entry errors",
    ],
    tags: ["Python", "YOLO", "SQL"],
  },
  {
    period: "Jan - April 2025",
    org: "SDG3 Health",
    role: "Software Engineering Intern",
    advisor: "Team of five",
    summary: "Non-invasive anemia screening for clinics.",
    points: [
      "50,000+ images, REST APIs, containerized pipelines",
      "UNet++ at 94% Dice, 1.5 MB on the phone",
      "Inference cost down 68% via quantization and pruning",
    ],
    tags: ["UNet++", "ONNX", "React Native"],
  },
];

export type SkillGroup = {
  label: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  { label: "Languages", items: ["Python", "C", "C++", "TypeScript", "JavaScript", "SQL", "Bash", "GDScript"] },
  { label: "ML & Research", items: ["PyTorch", "NumPy", "Pandas", "Scikit-learn", "OpenCV", "HuggingFace Transformers", "PPO", "QLoRA", "SHAP", "Empirical Methods in NLP", "Statistical Methods in AI", "Psycholinguistics", "LLM-as-a-Judge", "Ablation studies"] },
  { label: "Models", items: ["DeBERTa", "BERT", "Phi-2", "Whisper", "Qwen", "UNet++", "YOLO", "PaddleOCR", "ONNX Runtime", "TFLite", "Ollama"] },
  { label: "Systems & Infra", items: ["Distributed Systems", "Multi-threading", "POSIX", "TCP/IP", "Linux/Unix", "Raft", "Redis", "Docker", "Git"] },
  { label: "Software Engineering", items: ["System Design", "REST APIs", "Microservices", "Test-Driven Development", "CI/CD", "FastAPI", "MCP"] },
  { label: "Web & Product", items: ["React", "Next.js", "Node.js", "Express", "React Native", "Expo", "MongoDB", "Streamlit", "PyQt6", "Godot"] },
  { label: "Coursework", items: ["Data Structures & Algorithms", "Algorithm Analysis & Design", "Operating Systems & Networks", "Design & Analysis of Software Systems", "Data & Applications", "Computer Systems Organization", "Probability & Statistics", "Discrete Structures"] },
];


/** The reel: one entry per screen, used by the scene rail and the opening's film strip. */
export const scenes = [
  { id: "opening", label: "Opening" },
  { id: "systems", label: "Systems" },
  { id: "intelligence", label: "Voice & crypto" },
  { id: "applied", label: "Applied" },
  { id: "research", label: "Research" },
  { id: "experience", label: "Experience" },
  { id: "tools", label: "Tools" },
  { id: "contact", label: "Contact" },
] as const;



export const education = {
  period: "Aug 2023 - May 2028",
  school: "IIIT Hyderabad",
  degree: "Dual degree: B.Tech in Computer Science + MS by Research in Computational Linguistics",
  line: "CGPA 8.21 · Dean's List and Research List Award, 2025-26 · Undergraduate researcher at LTRC",
};
