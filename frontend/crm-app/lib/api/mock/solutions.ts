import type { Solution, SolutionStatus } from "@/lib/types";

// Display interface for Solutions (reconciles schema differences)
export interface SolutionDisplay extends Omit<Solution, "createdAt" | "updatedAt"> {
  id: number;
  solutionNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  author: string;
  status: SolutionStatus;
  views?: number;
  likes?: number;
  dislikes?: number;
  helpful?: number;
  rating?: number;
  comments?: number;
  created: string;
  lastModified: string;
  tags?: string[];
}

// Sample solutions data
const initialSolutions: SolutionDisplay[] = [
  {
    id: 1,
    solutionNumber: "SOL-001",
    title: "How to reset your password",
    description: "Step-by-step guide to reset your password:\n\n1. Click 'Forgot Password' on login page\n2. Enter your email address\n3. Check your email for reset link\n4. Click the link and enter new password\n5. Login with new credentials\n\nPassword requirements: 8+ characters, 1 uppercase, 1 number, 1 special character.",
    category: "Authentication",
    subcategory: "Password Management",
    author: "Sarah Wilson",
    status: "Published",
    views: 1250,
    likes: 89,
    dislikes: 3,
    helpful: 95,
    rating: 4.8,
    comments: 12,
    created: "2026-01-15",
    lastModified: "2026-02-01",
    tags: ["password", "authentication", "login"],
  },
  {
    id: 2,
    solutionNumber: "SOL-002",
    title: "Fixing CSV export issues",
    description: "If your CSV exports are showing incorrect data or formatting issues:\n\n1. Clear your browser cache\n2. Ensure no special characters in field names\n3. Try exporting with fewer records first\n4. Check your data doesn't exceed 10,000 rows\n5. Contact support if issue persists\n\nNote: Phone numbers are automatically formatted as text to prevent Excel converting them to numbers.",
    category: "Data Export",
    subcategory: "CSV",
    author: "Tom Rodriguez",
    status: "Published",
    views: 856,
    likes: 67,
    dislikes: 5,
    helpful: 92,
    rating: 4.6,
    comments: 8,
    created: "2026-01-20",
    lastModified: "2026-02-03",
    tags: ["export", "csv", "data"],
  },
  {
    id: 3,
    solutionNumber: "SOL-003",
    title: "API rate limits and best practices",
    description: "Understanding API rate limits:\n\n**Free Plan:** 1,000 requests/hour\n**Starter Plan:** 5,000 requests/hour\n**Pro Plan:** 25,000 requests/hour\n**Enterprise:** Custom limits\n\nBest practices:\n- Implement exponential backoff\n- Use bulk endpoints when available\n- Cache responses when possible\n- Monitor your usage in dashboard",
    category: "API Documentation",
    subcategory: "Rate Limits",
    author: "Michael Chen",
    status: "Published",
    views: 2340,
    likes: 156,
    dislikes: 8,
    helpful: 94,
    rating: 4.7,
    comments: 24,
    created: "2026-01-10",
    lastModified: "2026-02-05",
    tags: ["api", "rate-limits", "documentation"],
  },
  {
    id: 4,
    solutionNumber: "SOL-004",
    title: "Setting up two-factor authentication",
    description: "Enable 2FA for enhanced security:\n\n1. Go to Settings > Security\n2. Click 'Enable Two-Factor Authentication'\n3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)\n4. Enter verification code from app\n5. Save backup codes in secure location\n\nSupported apps: Google Authenticator, Authy, Microsoft Authenticator, 1Password.",
    category: "Security",
    subcategory: "Two-Factor Auth",
    author: "Lisa Anderson",
    status: "Published",
    views: 1890,
    likes: 142,
    dislikes: 2,
    helpful: 98,
    rating: 4.9,
    comments: 15,
    created: "2026-01-25",
    lastModified: "2026-02-04",
    tags: ["security", "2fa", "authentication"],
  },
  {
    id: 5,
    solutionNumber: "SOL-005",
    title: "Bulk operations guide",
    description: "How to use bulk operations efficiently:\n\n1. Select items using checkboxes\n2. Use 'Select All' for current page or filtered items\n3. Choose bulk action from toolbar\n4. Confirm action in modal\n\nAvailable bulk actions:\n- Delete multiple records\n- Update status/stage\n- Export selected items\n- Assign owner\n\nTip: Use advanced filters to select specific groups before bulk operations.",
    category: "User Guide",
    subcategory: "Features",
    author: "Sarah Wilson",
    status: "Published",
    views: 945,
    likes: 78,
    dislikes: 4,
    helpful: 91,
    rating: 4.5,
    comments: 11,
    created: "2026-02-01",
    lastModified: "2026-02-05",
    tags: ["bulk-operations", "guide", "features"],
  },
  {
    id: 6,
    solutionNumber: "SOL-006",
    title: "Dashboard customization options",
    description: "Customize your dashboard:\n\n1. Show/hide stats cards with eye icon\n2. Toggle between list and grid views\n3. Set default items per page\n4. Save filter presets for quick access\n5. Use keyboard shortcuts (Cmd+N, Cmd+K)\n\nAll preferences are saved automatically and persist across sessions.",
    category: "User Guide",
    subcategory: "Dashboard",
    author: "Michael Chen",
    status: "Draft",
    views: 234,
    likes: 18,
    dislikes: 1,
    helpful: 85,
    rating: 4.2,
    comments: 3,
    created: "2026-02-05",
    lastModified: "2026-02-05",
    tags: ["dashboard", "customization", "ui"],
  },
  {
    id: 7,
    solutionNumber: "SOL-007",
    title: "Mobile app troubleshooting",
    description: "Common mobile app issues and fixes:\n\n**App won't load:**\n- Check internet connection\n- Clear app cache\n- Reinstall app\n\n**Sync issues:**\n- Pull down to refresh\n- Check sync settings\n- Ensure latest app version\n\n**Login problems:**\n- Reset password\n- Clear cookies\n- Try different network",
    category: "Mobile",
    subcategory: "Troubleshooting",
    author: "Tom Rodriguez",
    status: "Published",
    views: 1456,
    likes: 98,
    dislikes: 12,
    helpful: 88,
    rating: 4.4,
    comments: 19,
    created: "2026-01-28",
    lastModified: "2026-02-02",
    tags: ["mobile", "troubleshooting", "app"],
  },
  {
    id: 8,
    solutionNumber: "SOL-008",
    title: "Integration with third-party tools",
    description: "Connect external tools to your CRM:\n\n**Available Integrations:**\n- Slack - Team notifications\n- Zapier - Workflow automation\n- Google Calendar - Meeting sync\n- Mailchimp - Email campaigns\n- Stripe - Payment processing\n\nTo set up:\n1. Go to Settings > Integrations\n2. Select integration\n3. Follow authorization flow\n4. Configure sync settings",
    category: "Integrations",
    subcategory: "Setup",
    author: "Lisa Anderson",
    status: "Published",
    views: 3120,
    likes: 234,
    dislikes: 15,
    helpful: 93,
    rating: 4.6,
    comments: 42,
    created: "2026-01-12",
    lastModified: "2026-02-04",
    tags: ["integrations", "api", "automation"],
  },
];

// In-memory storage
let solutions = [...initialSolutions];

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API
export const mockSolutionsApi = {
  getAll: async (): Promise<SolutionDisplay[]> => {
    await delay(300);
    return [...solutions];
  },

  getById: async (id: number): Promise<SolutionDisplay | undefined> => {
    await delay(200);
    return solutions.find((s) => s.id === id);
  },

  create: async (data: Partial<SolutionDisplay>): Promise<SolutionDisplay> => {
    await delay(500);
    const newSolution: SolutionDisplay = {
      id: Math.max(0, ...solutions.map((s) => s.id || 0)) + 1,
      solutionNumber: `SOL-${String(solutions.length + 1).padStart(3, "0")}`,
      title: data.title || "",
      description: data.description || "",
      category: data.category || "",
      subcategory: data.subcategory,
      author: data.author || "System",
      status: data.status || "Draft",
      views: 0,
      likes: 0,
      dislikes: 0,
      helpful: 0,
      rating: 0,
      comments: 0,
      created: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
      tags: data.tags || [],
    };
    solutions = [newSolution, ...solutions];
    return newSolution;
  },

  update: async (id: number, data: Partial<SolutionDisplay>): Promise<SolutionDisplay> => {
    await delay(400);
    const index = solutions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Solution not found");
    
    solutions[index] = {
      ...solutions[index],
      ...data,
      lastModified: new Date().toISOString().split("T")[0],
    };
    return solutions[index];
  },

  delete: async (id: number): Promise<void> => {
    await delay(400);
    solutions = solutions.filter((s) => s.id !== id);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    await delay(600);
    solutions = solutions.filter((s) => !ids.includes(s.id || 0));
  },

  bulkUpdate: async (ids: number[], data: Partial<SolutionDisplay>): Promise<void> => {
    await delay(600);
    solutions = solutions.map((s) =>
      ids.includes(s.id || 0)
        ? { ...s, ...data, lastModified: new Date().toISOString().split("T")[0] }
        : s
    );
  },
};
