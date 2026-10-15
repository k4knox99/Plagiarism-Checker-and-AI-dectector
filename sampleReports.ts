import { ComprehensiveReport } from '../types';
import { SAMPLE_TEXTS } from './samples';

export const SAMPLE_REPORTS: Record<string, ComprehensiveReport> = {
  'ai-essay': {
    compositeAuthenticity: 8,
    aiAnalysis: {
      overallAiScore: 94,
      verdict: 'Likely AI-Generated',
      confidence: 'High',
      metrics: {
        perplexityScore: 11,
        burstinessScore: 16,
        repetitionScore: 92,
        syntacticUniformity: 89,
        clicheCount: 5
      },
      overallSummary: "The text exhibits classic synthetic signatures: uniform sentence length (21.5 words/sentence), mechanical parallel syntax, and high density of hallmark LLM tropes ('pivotal testament', 'navigating the complex landscape', 'delve into', 'tapestry of opportunities', 'beacon of progress').",
      flaggedCliches: [
        {
          wordOrPhrase: "testament to",
          count: 1,
          reason: "Formulaic rhetorical cliché",
          alternative: "evidence of, reflects"
        },
        {
          wordOrPhrase: "delve into",
          count: 1,
          reason: "Overused hallmark AI vocabulary",
          alternative: "examine, explore, analyze"
        },
        {
          wordOrPhrase: "navigating the landscape",
          count: 1,
          reason: "Corporate LLM conversational filler",
          alternative: "handling the realities, addressing the field"
        },
        {
          wordOrPhrase: "tapestry of",
          count: 1,
          reason: "Stereotypical synthetic metaphor",
          alternative: "array of, combination of"
        },
        {
          wordOrPhrase: "beacon of",
          count: 1,
          reason: "Predictable synthetic emphasis trope",
          alternative: "model for, driving force behind"
        }
      ],
      sentenceAnalysis: [
        {
          sentence: "In the contemporary digital era, artificial intelligence stands as a pivotal testament to human ingenuity.",
          aiProbability: 96,
          category: 'ai',
          reasons: ["Generic introductory formula ('In the contemporary digital era')", "Hallmark AI cliché 'pivotal testament'"],
          suggestedRewrite: "Artificial intelligence has become one of the clearest demonstrations of what human engineering can achieve."
        },
        {
          sentence: "As society continues navigating the complex landscape of technological advancement, it is crucial to delve into the ethical implications of autonomous decision-making algorithms.",
          aiProbability: 95,
          category: 'ai',
          reasons: ["Contains two major AI tropes: 'navigating the landscape' and 'delve into'", "Overly balanced subordinate clause"],
          suggestedRewrite: "As these tools spread, we need to confront the ethical risks of handing decisions over to automated code."
        },
        {
          sentence: "Furthermore, machine learning systems play an indispensable role across multifaceted sectors, ranging from healthcare diagnostics to financial forecasting.",
          aiProbability: 92,
          category: 'ai',
          reasons: ["Mechanical transition connector 'Furthermore'", "Generic AI word pairing 'multifaceted sectors'"],
          suggestedRewrite: "Machine learning is already reshaping hospitals, investment desks, and credit bureaus."
        },
        {
          sentence: "The tapestry of opportunities presented by these algorithmic architectures offers seamless integration into daily societal workflows.",
          aiProbability: 97,
          category: 'ai',
          reasons: ["Classic hallmark AI metaphor 'tapestry of opportunities'", "Corporate filler adverb 'seamless'"],
          suggestedRewrite: "These architectures create practical tools that slot directly into everyday routines."
        },
        {
          sentence: "However, one must remember that safeguarding algorithmic transparency remains of paramount importance.",
          aiProbability: 88,
          category: 'ai',
          reasons: ["Formal passive phrasing 'one must remember'", "Predictable emphasis trope 'paramount importance'"],
          suggestedRewrite: "Still, systems need to explain how they reach their conclusions, or trust evaporates."
        },
        {
          sentence: "By fostering a collaborative ecosystem between policymakers and technologists, we can ensure that artificial intelligence serves as a beacon of progress rather than an instrument of division.",
          aiProbability: 94,
          category: 'ai',
          reasons: ["Institutional cliché 'fostering a collaborative ecosystem'", "Metaphorical antithesis 'beacon of progress rather than an instrument of division'"],
          suggestedRewrite: "If regulators and engineers talk openly, AI can solve real problems instead of deepening social divides."
        },
        {
          sentence: "In conclusion, the trajectory of artificial intelligence will inevitably shape the destiny of humankind.",
          aiProbability: 95,
          category: 'ai',
          reasons: ["Robotic conclusion marker 'In conclusion'", "Hyperbolic fatalistic claim"],
          suggestedRewrite: "Ultimately, how we govern this technology right now will define our future."
        }
      ]
    },
    plagiarismAnalysis: {
      similarityScore: 0,
      verdict: 'Original Synthetic Content',
      summary: 'No verbatim copied passages detected across indexed journals or encyclopedias. The text is entirely machine-generated rather than plagiarized from published literature.',
      matchedSources: [],
      flaggedPassages: []
    },
    localMetrics: {
      sentenceCount: 7,
      wordCount: 161,
      avgSentenceLength: 23,
      burstinessScore: 16,
      lexicalDiversity: 0.61
    },
    scannedAt: 'Just now (Instant Baseline)',
    originalText: SAMPLE_TEXTS[0].content
  },

  'plagiarized-paper': {
    compositeAuthenticity: 28,
    aiAnalysis: {
      overallAiScore: 35,
      verdict: 'Mixed / Human-Authored Technical Reference',
      confidence: 'Medium',
      metrics: {
        perplexityScore: 48,
        burstinessScore: 42,
        repetitionScore: 35,
        syntacticUniformity: 45,
        clicheCount: 0
      },
      overallSummary: 'The text exhibits natural technical phrasing without overt AI tropes, but extensive portions match verbatim published encyclopedic explanations of quantum computing principles.',
      flaggedCliches: [],
      sentenceAnalysis: [
        {
          sentence: "Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers.",
          aiProbability: 40,
          category: 'mixed',
          reasons: ["Verbatim match with IBM Quantum & Wikipedia definitions"],
          suggestedRewrite: "Unlike ordinary binary processors, quantum devices exploit atomic-level physics to crack problems that overwhelm conventional chips."
        },
        {
          sentence: "Classical computers encode information into binary bits that can either be zeros or ones.",
          aiProbability: 20,
          category: 'human',
          reasons: ["Standard factual statement"],
          suggestedRewrite: "Every conventional computer runs on bits fixed strictly at 0 or 1."
        },
        {
          sentence: "In contrast, quantum computing uses qubits, which can exist in a multidimensional state known as superposition.",
          aiProbability: 35,
          category: 'mixed',
          reasons: ["Standard textbook definition with high online similarity"],
          suggestedRewrite: "Quantum setups rely instead on qubits that hold complex overlapping combinations through superposition."
        },
        {
          sentence: "Quantum computers can also take advantage of entanglement, an extremely strong correlation that exists between quantum particles.",
          aiProbability: 45,
          category: 'mixed',
          reasons: ["Direct quote from published physics summaries"],
          suggestedRewrite: "They also leverage entanglement, where linked particles influence each other instantly regardless of distance."
        },
        {
          sentence: "Because of superposition and entanglement, a quantum computer can calculate a vast number of possibilities at the same time.",
          aiProbability: 38,
          category: 'mixed',
          reasons: ["Common introductory quantum physics phrase"],
          suggestedRewrite: "Coupling these two phenomena allows processors to evaluate entire state spaces in parallel."
        },
        {
          sentence: "The primary physical limitation of quantum computing is decoherence, where quantum states decay rapidly due to thermal vibrations and stray electromagnetic fields from the environment.",
          aiProbability: 30,
          category: 'human',
          reasons: ["High verbatim overlap with quantum physics reference texts"],
          suggestedRewrite: "The main roadblock remains environmental decoherence—heat and stray magnetic noise collapse delicate quantum calculations in milliseconds."
        }
      ]
    },
    plagiarismAnalysis: {
      similarityScore: 78,
      verdict: 'High Plagiarism Risk (Copied Text Detected)',
      summary: 'Multiple verbatim and near-verbatim passages match published definitions from IBM Quantum Research, Nature Physics, and Wikipedia entries on Quantum Mechanics.',
      matchedSources: [
        {
          title: 'IBM Quantum: What is Quantum Computing?',
          url: 'https://www.ibm.com/topics/quantum-computing',
          domain: 'ibm.com',
          matchPercentage: 46,
          studentExcerpt: 'Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers.',
          matchedExcerpt: 'Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers.',
          citationFormatted: {
            apa: 'IBM Corporation. (2024). What is quantum computing? IBM Topics. https://www.ibm.com/topics/quantum-computing',
            mla: 'IBM Corporation. "What is Quantum Computing?" IBM, 2024, www.ibm.com/topics/quantum-computing.'
          }
        },
        {
          title: 'Quantum Computing - Wikipedia & Physics Reference',
          url: 'https://en.wikipedia.org/wiki/Quantum_computing',
          domain: 'wikipedia.org',
          matchPercentage: 32,
          studentExcerpt: 'The primary physical limitation of quantum computing is decoherence, where quantum states decay rapidly due to thermal vibrations...',
          matchedExcerpt: 'Decoherence is the primary physical limitation where quantum states decay due to thermal vibrations and stray electromagnetic fields...',
          citationFormatted: {
            apa: 'Wikipedia contributors. (2024). Quantum computing. In Wikipedia, The Free Encyclopedia.',
            mla: '"Quantum Computing." Wikipedia, The Free Encyclopedia, Wikimedia Foundation.'
          }
        }
      ],
      flaggedPassages: [
        {
          passage: "Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers.",
          similarity: 98,
          matchedSourceTitle: "IBM Quantum Computing Overview",
          matchedSourceUrl: "https://www.ibm.com/topics/quantum-computing",
          recommendation: "Quote and cite"
        },
        {
          passage: "The primary physical limitation of quantum computing is decoherence, where quantum states decay rapidly due to thermal vibrations and stray electromagnetic fields from the environment.",
          similarity: 84,
          matchedSourceTitle: "Quantum Mechanics & Decoherence Literature",
          matchedSourceUrl: "https://en.wikipedia.org/wiki/Quantum_decoherence",
          recommendation: "Paraphrase with attribution"
        }
      ]
    },
    localMetrics: {
      sentenceCount: 6,
      wordCount: 114,
      avgSentenceLength: 19,
      burstinessScore: 42,
      lexicalDiversity: 0.58
    },
    scannedAt: 'Just now (Instant Baseline)',
    originalText: SAMPLE_TEXTS[1].content
  },

  'human-narrative': {
    compositeAuthenticity: 98,
    aiAnalysis: {
      overallAiScore: 3,
      verdict: 'Likely Human',
      confidence: 'High',
      metrics: {
        perplexityScore: 92,
        burstinessScore: 88,
        repetitionScore: 8,
        syntacticUniformity: 12,
        clicheCount: 0
      },
      overallSummary: 'High burstiness and lexical entropy with authentic narrative rhythm. Vivid sensory details, natural sentence length variation (from 2 words to 26 words), colloquial cadence, and complete absence of formulaic AI transition markers.',
      flaggedCliches: [],
      sentenceAnalysis: [
        {
          sentence: "It was 3:17 in the morning.",
          aiProbability: 2,
          category: 'human',
          reasons: ["Short punchy opening statement", "Natural human time marker"],
          suggestedRewrite: "It was 3:17 in the morning."
        },
        {
          sentence: "My mug of Earl Grey had gone lukewarm three hours earlier, but I still took a sip anyway out of sheer caffeine-deprived stubbornness.",
          aiProbability: 4,
          category: 'human',
          reasons: ["Sensory detail", "High vocabulary surprise", "Idiosyncratic human reaction"],
          suggestedRewrite: "My mug of Earl Grey had gone lukewarm three hours earlier, but I still took a sip anyway."
        },
        {
          sentence: "On my left monitor, the terminal was spitting out a wall of red stack traces.",
          aiProbability: 5,
          category: 'human',
          reasons: ["Authentic technical jargon in narrative context"],
          suggestedRewrite: "On my left monitor, the terminal spit red stack traces."
        },
        {
          sentence: "Memory leak in the websocket buffer.",
          aiProbability: 2,
          category: 'human',
          reasons: ["Fragment sentence showing high burstiness"],
          suggestedRewrite: "Memory leak in the websocket buffer."
        },
        {
          sentence: "Again.",
          aiProbability: 1,
          category: 'human',
          reasons: ["Single-word cadence punch impossible in standard AI output"],
          suggestedRewrite: "Again."
        },
        {
          sentence: "I leaned back into my squeaky thrift-store chair, rubbed my eyelids until I saw little white sparks, and muttered something unprintable at the ceiling.",
          aiProbability: 3,
          category: 'human',
          reasons: ["High emotional resonance and visceral sensory details"],
          suggestedRewrite: "I leaned back into my squeaky chair, rubbed my eyelids, and muttered at the ceiling."
        },
        {
          sentence: "Then I saw it.",
          aiProbability: 2,
          category: 'human',
          reasons: ["Natural dramatic pacing"],
          suggestedRewrite: "Then I saw it."
        },
        {
          sentence: "Line 142.",
          aiProbability: 1,
          category: 'human',
          reasons: ["Punchy detail"],
          suggestedRewrite: "Line 142."
        },
        {
          sentence: "A missed semicolon?",
          aiProbability: 2,
          category: 'human',
          reasons: ["Rhetorical self-questioning"],
          suggestedRewrite: "A missed semicolon?"
        },
        {
          sentence: "No, worse: an accidental closure over a mutable reference inside a loop.",
          aiProbability: 3,
          category: 'human',
          reasons: ["Conversational contrast and technical specificity"],
          suggestedRewrite: "No, worse: an accidental closure over a mutable reference inside a loop."
        },
        {
          sentence: "I changed four characters, tapped git commit, and exhaled.",
          aiProbability: 2,
          category: 'human',
          reasons: ["Rhythmic verb trios with authentic pacing"],
          suggestedRewrite: "I changed four characters, tapped git commit, and exhaled."
        },
        {
          sentence: "Nothing quite matches that raw, ridiculous dopamine hit when a broken build finally goes green while the rest of the neighborhood is dead asleep.",
          aiProbability: 4,
          category: 'human',
          reasons: ["Authentic personal emotional climax"],
          suggestedRewrite: "Nothing beats that dopamine hit when a broken build finally goes green while the world is asleep."
        }
      ]
    },
    plagiarismAnalysis: {
      similarityScore: 0,
      verdict: '100% Original Narrative',
      summary: 'Completely unique personal narrative with zero web matches across all literature and digital archives.',
      matchedSources: [],
      flaggedPassages: []
    },
    localMetrics: {
      sentenceCount: 12,
      wordCount: 147,
      avgSentenceLength: 12.2,
      burstinessScore: 88,
      lexicalDiversity: 0.74
    },
    scannedAt: 'Just now (Instant Baseline)',
    originalText: SAMPLE_TEXTS[2].content
  }
};
