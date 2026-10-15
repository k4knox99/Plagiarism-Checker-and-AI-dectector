export interface SampleText {
  id: string;
  title: string;
  category: 'ai' | 'plagiarism' | 'human';
  description: string;
  badge: string;
  content: string;
}

export const SAMPLE_TEXTS: SampleText[] = [
  {
    id: 'ai-essay',
    title: 'AI Ethics & Society (Generated)',
    category: 'ai',
    description: 'Filled with typical LLM formulas, uniform cadence, and buzzwords (delve, testament, pivotal).',
    badge: 'Expected AI: 92%',
    content: `In the contemporary digital era, artificial intelligence stands as a pivotal testament to human ingenuity. As society continues navigating the complex landscape of technological advancement, it is crucial to delve into the ethical implications of autonomous decision-making algorithms.

Furthermore, machine learning systems play an indispensable role across multifaceted sectors, ranging from healthcare diagnostics to financial forecasting. The tapestry of opportunities presented by these algorithmic architectures offers seamless integration into daily societal workflows.

However, one must remember that safeguarding algorithmic transparency remains of paramount importance. By fostering a collaborative ecosystem between policymakers and technologists, we can ensure that artificial intelligence serves as a beacon of progress rather than an instrument of division. In conclusion, the trajectory of artificial intelligence will inevitably shape the destiny of humankind.`
  },
  {
    id: 'plagiarized-paper',
    title: 'Quantum Computing Excerpt (Web Match)',
    category: 'plagiarism',
    description: 'Direct verbatim quotes and uncredited excerpts from standard physics literature and encyclopedias.',
    badge: 'Expected Similarity: ~75%',
    content: `Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers. Classical computers encode information into binary bits that can either be zeros or ones. In contrast, quantum computing uses qubits, which can exist in a multidimensional state known as superposition.

Quantum computers can also take advantage of entanglement, an extremely strong correlation that exists between quantum particles. Because of superposition and entanglement, a quantum computer can calculate a vast number of possibilities at the same time. The primary physical limitation of quantum computing is decoherence, where quantum states decay rapidly due to thermal vibrations and stray electromagnetic fields from the environment.`
  },
  {
    id: 'human-narrative',
    title: 'Memoir on Late-Night Coding (Authentic Human)',
    category: 'human',
    description: 'Organic human voice with high burstiness, colloquial cadence, sensory details, and zero AI tropes.',
    badge: 'Expected Human: 98%',
    content: `It was 3:17 in the morning. My mug of Earl Grey had gone lukewarm three hours earlier, but I still took a sip anyway out of sheer caffeine-deprived stubbornness. 

On my left monitor, the terminal was spitting out a wall of red stack traces. Memory leak in the websocket buffer. Again. I leaned back into my squeaky thrift-store chair, rubbed my eyelids until I saw little white sparks, and muttered something unprintable at the ceiling. 

Then I saw it. Line 142. A missed semicolon? No, worse: an accidental closure over a mutable reference inside a loop. I changed four characters, tapped git commit, and exhaled. Nothing quite matches that raw, ridiculous dopamine hit when a broken build finally goes green while the rest of the neighborhood is dead asleep.`
  }
];
