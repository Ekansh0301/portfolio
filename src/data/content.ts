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
  availability: "Open to research & SWE roles",
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
  blurb: string;
  stack: string[];
  href: string;
  metric: string;
  accent: "ember" | "orange" | "steel" | "violet";
  kind: "ring" | "critics" | "voice" | "cipher" | "leaf" | "planes";
};

export const projects: Project[] = [
  {
    title: "QuorumKV",
    blurb:
      "A masterless, DynamoDB-inspired key-value store. Peers gossip over a 128-bit consistent hash ring with virtual nodes, while tunable N/R/W quorums, vector clocks, hinted handoff and Merkle-tree anti-entropy keep it available straight through a partition.",
    stack: ["Python", "Redis", "Gossip"],
    href: "https://github.com/Ekansh0301/QuorumKV",
    metric: "Survives node failure",
    accent: "ember",
    kind: "ring",
  },
  {
    title: "The Director LLM",
    blurb:
      "Multi-critic reinforcement learning for interactive narrative. Four independently trained critics score narrative quality, causal consistency, world coherence and character voice, and an intent-conditioned weighting function decides which one should dominate each turn.",
    stack: ["PyTorch", "PPO", "QLoRA"],
    href: "https://github.com/Ekansh0301/Dropout-Squad",
    metric: "+48.3% over supervised baseline",
    accent: "violet",
    kind: "critics",
  },
  {
    title: "Vox",
    blurb:
      "Hold a key, talk, let go. Vox opens apps and links, runs shell commands, writes files, reads whatever is on your screen, and answers in a voice of its own. All of it happens on a 4 GB laptop GPU, so there is no subscription, no API key, and nothing leaves the machine.",
    stack: ["Ollama", "Whisper", "Piper"],
    href: "https://github.com/Ekansh0301/Voxd",
    metric: "Fully offline, no API keys",
    accent: "orange",
    kind: "voice",
  },
  {
    title: "CryptoStack",
    blurb:
      "Twenty cryptographic primitives written from first principles on the Python standard library alone, from one-way functions up to 2-party MPC via oblivious transfer, behind a 50-endpoint API and a dashboard built to let you break each one.",
    stack: ["FastAPI", "React", "Cryptography"],
    href: "https://github.com/Ekansh0301/CryptoStack",
    metric: "20 primitives, stdlib only",
    accent: "steel",
    kind: "cipher",
  },
  {
    title: "CropGuard AI",
    blurb:
      "Photograph a sick leaf, get a diagnosis and a farmer-readable action plan. MobileNetV3-Small fine-tuned across 54,303 PlantVillage images with two-stage unfreezing and OneCycleLR, shipped as an offline-capable PWA.",
    stack: ["PyTorch", "Streamlit", "PWA"],
    href: "https://github.com/amanuniyal5/CropGuard-AI",
    metric: "Diagnoses 38 diseases offline",
    accent: "orange",
    kind: "leaf",
  },
  {
    title: "Fault-Tolerant Distributed Storage",
    blurb:
      "A concurrent distributed file system in C that splits the metadata and data planes. A Naming Server owns the directory tree behind a thread-safe LRU cache, then steps out of the way so clients stream bytes straight from storage nodes over TCP.",
    stack: ["C", "POSIX", "TCP/IP"],
    href: "https://github.com/Ekansh0301/Fault-Tolerant-Distributed-Storage-System",
    metric: "Zero data loss on crash",
    accent: "ember",
    kind: "planes",
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
    summary:
      "Building deep learning NLP for multi-objective narrative generation and cross-linguistic psycholinguistic analysis under Dr. Rajakrishnan Rajkumar.",
    points: [
      "Teaching Assistant for Computational Linguistics II with formal commendation",
      "First-authored SemEval @ ACL 2026 paper on conspiracy belief detection",
      "Research List Award recipient, 2025-26",
    ],
  },
  {
    period: "May 2025 - June 2025",
    org: "Sanwariya Ji Synthetics",
    role: "Software Engineer Intern",
    summary:
      "Engineered an automated Python inventory pipeline replacing a legacy dispatch workflow.",
    points: [
      "Integrated YOLO + PaddleOCR to digitize handwritten records",
      "Normalized ingested data into a structured SQL schema",
      "Eliminated manual entry errors and data discrepancies",
    ],
  },
  {
    period: "Jan 2025 - April 2025",
    org: "SDG3Health",
    role: "Project Intern",
    summary:
      "Developed a non-invasive anemia detection pipeline via UNet++ conjunctiva segmentation with image quality gating.",
    points: [
      "94% Dice Score on conjunctiva segmentation",
      "Deployed a 1.5MB quantized edge model to a React Native app",
      "Added government ID OCR and longitudinal record tracking",
    ],
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

export const philosophy =
  "I believe the best systems are the ones you can reason about all the way down. Every abstraction, every benchmark, every line of code is a chance to make something rigorous feel effortless.";
