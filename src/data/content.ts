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
      "A decision layer for financial advisors. It runs a recommendation and its alternatives on the same 10,000 futures, explains in dollars why one wins, and writes a file a regulator can replay.",
    blurb:
      "Crash-test every recommendation before the client signs. Foresight reads a family's statements into a digital twin, runs a recommendation and its alternatives through the same 10,000 simulated futures, and turns the answer into a Best-Interest File: every number linked to its source, a replay that reproduces it to the cent, and a tamper-evident record. First prize at LPL WealthX 2026, with Krishna and Devansh.",
    stack: ["Python", "NumPy", "Next.js"],
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
    advisor: "Advisor: Prof. Rajakrishnan Rajkumar",
    summary:
      "Deep-learning NLP for narrative and psycholinguistics: what makes a scene matter, and how belief shows up in text.",
    points: [
      "First author of the SemEval-2026 paper on conspiracy belief detection.",
      "Led the EMNLP 2026 scene-saliency paper: +16% detection F1 on a 133K-sample dataset through architecture changes and ablations.",
      "Built reproducible experiment infrastructure (data versioning, hyperparameter tracking, CI evaluation): 40% faster iteration.",
      "Teaching Assistant for Computational Linguistics II, with formal commendation. Research List Award, 2025-26.",
    ],
    tags: ["PyTorch", "Transformers", "SHAP", "CI"],
  },
  {
    period: "May 2025 - June 2025",
    org: "Sanwariya Ji Synthetics",
    role: "Software Engineer Intern",
    advisor: "Industry internship",
    summary: "Replaced a legacy dispatch workflow with an automated inventory pipeline.",
    points: [
      "Integrated YOLO and PaddleOCR to digitize handwritten records.",
      "Normalized the ingested data into a structured SQL schema.",
      "Eliminated manual entry errors and data discrepancies.",
    ],
    tags: ["Python", "YOLO", "PaddleOCR", "SQL"],
  },
  {
    period: "Jan 2025 - April 2025",
    org: "SDG3 Health",
    role: "Software Engineering Intern",
    advisor: "Team of five · private repository",
    summary: "Non-invasive anemia detection from a photo of the inner eyelid, built for low-resource clinics.",
    points: [
      "Owned a medical imaging platform for 50,000+ diagnostic images, with production REST APIs and containerized pipelines.",
      "UNet++ conjunctiva segmentation at 94% Dice, shipped as a 1.5 MB quantized model in a React Native app.",
      "Cut cloud inference cost 68% through quantization and pruning, with Docker edge packaging for the field.",
    ],
    tags: ["UNet++", "ONNX", "React Native", "Docker"],
  },
];

export type SkillGroup = {
  label: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    label: "Languages",
    items: ["Python", "C", "TypeScript", "JavaScript", "SQL", "Bash"],
  },
  {
    label: "Deep Learning",
    items: ["PyTorch", "Transformers", "HuggingFace", "PPO", "QLoRA", "LoRA"],
  },
  {
    label: "Models & Inference",
    items: ["DeBERTa", "BERT", "YOLO", "UNet++", "PaddleOCR", "ONNX", "TFLite"],
  },
  {
    label: "Systems & Infra",
    items: [
      "Distributed Systems", "POSIX Threads", "TCP/IP", "Docker",
      "Redis", "Linux", "CI/CD", "Cryptography",
    ],
  },
  {
    label: "Web & Product",
    items: [
      "React", "Node.js", "Express", "FastAPI", "MongoDB",
      "Streamlit", "React Native", "PyQt6", "PWA",
    ],
  },
  {
    label: "Foundations",
    items: [
      "Data Structures & Algorithms", "Operating Systems", "Computer Networks",
      "Statistical Methods in AI", "Empirical Methods in NLP",
    ],
  },
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
