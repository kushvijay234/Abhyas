const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(API_KEY);
    console.log("Gemini API Initialized successfully with API_KEY");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err.message);
  }
} else {
  console.log("No GEMINI_API_KEY found in environment. Using fallback mock AI simulation.");
}

const extractJSON = (text) => {
  if (!text) return null;
  // Look for JSON block wrapped in ```json and ```
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {}
  }
  // Try parsing the text directly
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // If it fails, search for the first '{' and the last '}'
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const sliced = text.slice(startIdx, endIdx + 1);
      try {
        return JSON.parse(sliced.trim());
      } catch (e2) {}
    }
    throw e; // rethrow if all parsing attempts fail
  }
};

/**
 * Generates chat responses using gemini-3.5-flash.
 * If API_KEY is missing or error occurs, falls back to a rules-based educational responder.
 */
const generateResponse = async (prompt, systemInstruction = "") => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash",
        systemInstruction: systemInstruction 
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const responseText = result.response.text();
      return extractJSON(responseText);
    } catch (error) {
      console.error("Gemini API call failed, falling back to mock:", error.message);
    }
  }

  // Fallback Rule-Based Mock responder
  return getMockAIResponse(prompt);
};

/**
 * Generates a 3072-dimension embedding vector for RAG indexing.
 * If API_KEY is missing, generates a deterministic pseudo-random float array.
 */
const getEmbedding = async (text) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(text);
      if (result && result.embedding && result.embedding.values) {
        return result.embedding.values;
      }
    } catch (error) {
      console.error("Gemini Embedding API call failed, falling back to mock:", error.message);
    }
  }

  // Fallback: Generate a deterministic mock 3072-dimension vector based on text hashing
  const embedding = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  for (let i = 0; i < 3072; i++) {
    const val = Math.sin(hash + i) * 0.5;
    embedding.push(parseFloat(val.toFixed(6)));
  }
  return embedding;
};

/**
 * Generates mock responses structured as standard AI Tutor JSON.
 */
function getMockAIResponse(prompt) {
  const queryLower = prompt.toLowerCase();
  
  let answer = "I am ready to help you analyze topics. Try asking about Data Structures (like trees), DBMS transaction states, or CPU Scheduling algorithms.";
  let explanation = "Abhyas AI analyzes standard university and competitive exam curricula to provide targeted learning assistance.";
  let example = "Select one of the quick action buttons to construct quiz models or check course alignments.";
  let keyPoints = [
    "Ask specific syllabus questions on DBMS, DSA, or OS.",
    "Generate interactive practice quizzes to test your understanding.",
    "Save notes directly to your bookmarked collection."
  ];
  let formula = "";
  let relatedConcepts = ["Data Structures", "Database Normalization", "Process Scheduling"];
  let sources = ["Abhyas Syllabus Guides", "Standard Academic Textbooks"];
  let difficulty = "Medium";
  let studyTime = "10 mins";

  if (queryLower.includes("tree") || queryLower.includes("binary") || queryLower.includes("dsa")) {
    answer = "A Binary Tree is a hierarchical data structure in which each node has at most two children, referred to as the left child and the right child.";
    explanation = "In exam contexts, key areas of focus include binary tree traversals (In-order, Pre-order, Post-order), tree depth calculations, and binary search tree (BST) properties.";
    example = "```cpp\n// C++ Inorder traversal structure\nvoid inorder(Node* root) {\n    if (root == nullptr) return;\n    inorder(root->left);\n    cout << root->data << \" \";\n    inorder(root->right);\n}\n```";
    keyPoints = [
      "Maximum number of nodes at level L is 2^L.",
      "Balanced trees like AVL or Red-Black limit height to O(log n) for faster operations.",
      "An Inorder traversal of a Binary Search Tree (BST) visits nodes in sorted ascending order."
    ];
    formula = "h \\approx \\log_2(n) \\quad \\text{(Balanced Tree Height)}";
    relatedConcepts = ["Binary Search Tree (BST)", "AVL Trees", "Traversals (DFS/BFS)"];
    sources = ["Cormen Introduction to Algorithms", "GeeksforGeeks DSA Guides"];
    difficulty = "Medium";
    studyTime = "15 mins";
  } else if (queryLower.includes("dbms") || queryLower.includes("transaction") || queryLower.includes("normal")) {
    answer = "Database normalization minimises data redundancy. Transactions perform read/write operations adhering to ACID properties.";
    explanation = "Atomicity ensures 'all-or-nothing' execution. Isolation prevents dirty reads by serializing concurrent operations using locking protocols.";
    example = "```sql\n-- Create normalized table structure example\nCREATE TABLE Student (\n    StudentID INT PRIMARY KEY,\n    StudentName VARCHAR(100),\n    ClassID INT,\n    FOREIGN KEY (ClassID) REFERENCES Class(ClassID)\n);\n```";
    keyPoints = [
      "ACID: Atomicity, Consistency, Isolation, Durability.",
      "3NF requires relations to be in 2NF and have no transitive dependencies.",
      "BCNF is a stricter form of 3NF where every determinant must be a candidate key."
    ];
    formula = "\\text{ACID} = \\text{Atomicity, Consistency, Isolation, Durability}";
    relatedConcepts = ["Concurrency Control", "SQL Indexes", "Normal Forms (1NF, 2NF, 3NF, BCNF)"];
    sources = ["Silberschatz Database System Concepts", "DBMS Lecture Handouts"];
    difficulty = "Medium";
    studyTime = "20 mins";
  } else if (queryLower.includes("schedule") || queryLower.includes("os") || queryLower.includes("quantum")) {
    answer = "Operating Systems schedule CPU time using preemptive and non-preemptive strategies. Key goals are minimizing Turnaround Time and Response Time.";
    explanation = "Round Robin (RR) scheduling allocates a small unit of time called the time quantum to processes sequentially. If quantum is too small, context switching increases.";
    example = "```\nGantt Chart representation (Quantum = 2):\n| P1 (2) | P2 (2) | P1 (1) | P3 (1) |\nTime: 0  -> 2   -> 4   -> 5   -> 6\n```";
    keyPoints = [
      "FCFS suffers from the convoy effect.",
      "SJF (Shortest Job First) is optimal for average waiting times but can cause process starvation.",
      "Preemptive scheduling can interrupt executing tasks to give priority to other tasks."
    ];
    formula = "\\text{Average Turnaround Time} = \\frac{\\sum (\\text{Completion} - \\text{Arrival})}{N}";
    relatedConcepts = ["CPU Scheduling", "Context Switching", "Starvation and Aging"];
    sources = ["Galvin Operating System Concepts", "Core OS Curriculum Notes"];
    difficulty = "Hard";
    studyTime = "25 mins";
  } else if (queryLower.includes("network") || queryLower.includes("osi") || queryLower.includes("ip")) {
    answer = "The OSI Model is a conceptual 7-layer framework standardizing network communication protocols.";
    explanation = "Data flows down the OSI stack on transmission (encapsulation) and up the stack on reception (decapsulation). Layer 3 (Network) handles IP routing.";
    example = "```\nRouter operates at Layer 3 (Network Layer) reading IP addresses.\nSwitch operates at Layer 2 (Data Link Layer) reading MAC addresses.\n```";
    keyPoints = [
      "Layer 7: Application (HTTP, DNS, SMTP).",
      "Layer 4: Transport (TCP/UDP, handles flow control and reliability).",
      "Layer 3: Network (IP routing, logical addressing)."
    ];
    formula = "\\text{OSI Layers} = \\text{Application, Presentation, Session, Transport, Network, Data Link, Physical}";
    relatedConcepts = ["TCP/IP Model", "Logical Addressing", "Subnetting"];
    sources = ["Tanenbaum Computer Networks", "CCNA Networking Guides"];
    difficulty = "Easy";
    studyTime = "10 mins";
  }

  return {
    text: `Here is what I found regarding your query:\n\n${answer}`,
    confidence: "98%",
    sources: sources,
    difficulty: difficulty,
    studyTime: studyTime,
    language: "en",
    structuredData: {
      answer: answer,
      explanation: explanation,
      example: example,
      keyPoints: keyPoints,
      formula: formula,
      relatedConcepts: relatedConcepts
    }
  };
}

module.exports = {
  generateResponse,
  getEmbedding
};
