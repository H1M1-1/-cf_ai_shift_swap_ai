/**
 * Shift Swap AI - Cloudflare Workers AI Demo
 * 
 * Author: Haashim Malik
 * Created for: Cloudflare 2025 Internship Assignment
 * Date: October 2025
 * 
 * This application uses:
 * - Cloudflare Workers for serverless compute
 * - Durable Objects for persistent state management
 * - Workers AI (Llama 3.3) for intelligent shift matching
 * 
 * Architecture:
 * - Worker handles HTTP requests and routes to API endpoints
 * - ShiftRoom Durable Object stores all shift posts and matches
 * - AI model suggests best swap candidates based on role, date, and availability
 * 
 * © 2025 Haashim Malik - All Rights Reserved
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Env {
	AI: Ai;
	SHIFT_ROOM: DurableObjectNamespace;
	CORS_ALLOW_ORIGIN?: string;
	__STATIC_CONTENT?: KVNamespace;
}

interface ShiftPost {
	id: string;
	user: string;
	role: string;
	date: string; // ISO date string
	shift: string; // e.g., "09:00-17:00"
	notes: string;
	createdAt: string; // ISO timestamp
	status: 'open' | 'matched' | 'completed';
}

interface Match {
	id: string;
	requestId: string; // The shift post ID requesting a match
	candidateUser: string;
	reason: string;
	createdAt: string;
}

interface PostRequest {
	user: string;
	role: string;
	date: string;
	shift: string;
	notes: string;
}

interface MatchRequest {
	requestId: string;
}

interface MatchResponse {
	candidateUser: string;
	reason: string;
}

// ============================================================================
// DURABLE OBJECT: ShiftRoom
// ============================================================================

export class ShiftRoom {
	private state: DurableObjectState;
	private posts: ShiftPost[] = [];
	private matches: Match[] = [];
	private initialized = false;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
	}

	/**
	 * Initialize the Durable Object by loading data from storage
	 */
	private async initialize() {
		if (this.initialized) return;

		const [posts, matches] = await Promise.all([
			this.state.storage.get<ShiftPost[]>('posts'),
			this.state.storage.get<Match[]>('matches'),
		]);

		this.posts = posts || [];
		this.matches = matches || [];
		this.initialized = true;
	}

	/**
	 * Save current state to storage
	 */
	private async saveState() {
		await Promise.all([
			this.state.storage.put('posts', this.posts),
			this.state.storage.put('matches', this.matches),
		]);
	}

	/**
	 * Handle incoming requests to the Durable Object
	 */
	async fetch(request: Request): Promise<Response> {
		await this.initialize();

		const url = new URL(request.url);
		const path = url.pathname;

		try {
			// Route to appropriate handler
			if (path === '/post' && request.method === 'POST') {
				return await this.handlePost(request);
			} else if (path === '/list' && request.method === 'GET') {
				return await this.handleList(request);
			} else if (path === '/recordMatch' && request.method === 'POST') {
				return await this.handleRecordMatch(request);
			} else if (path === '/getPost' && request.method === 'GET') {
				return await this.handleGetPost(request);
			} else if (path === '/clear' && request.method === 'POST') {
				return await this.handleClear(request);
			}

			return new Response('Not Found', { status: 404 });
		} catch (error) {
			console.error('ShiftRoom error:', error);
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	/**
	 * Handle POST /post - Create a new shift post
	 */
	private async handlePost(request: Request): Promise<Response> {
		const body = await request.json<PostRequest>();

		// Validate required fields
		if (!body.user || !body.role || !body.date || !body.shift) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Create new post
		const post: ShiftPost = {
			id: crypto.randomUUID(),
			user: body.user,
			role: body.role,
			date: body.date,
			shift: body.shift,
			notes: body.notes || '',
			createdAt: new Date().toISOString(),
			status: 'open',
		};

		// Add to posts array (prepend for newest-first ordering)
		this.posts.unshift(post);

		// Save to storage
		await this.saveState();

		return new Response(JSON.stringify(post), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	/**
	 * Handle GET /list - List all open shift posts
	 */
	private async handleList(request: Request): Promise<Response> {
		// Return posts sorted by createdAt descending (newest first)
		const openPosts = this.posts.filter(p => p.status === 'open');
		
		return new Response(JSON.stringify(openPosts), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	/**
	 * Handle GET /getPost - Get a specific post by ID
	 */
	private async handleGetPost(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const id = url.searchParams.get('id');

		if (!id) {
			return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const post = this.posts.find(p => p.id === id);

		if (!post) {
			return new Response(JSON.stringify({ error: 'Post not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response(JSON.stringify(post), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	/**
	 * Handle POST /recordMatch - Record a new match suggestion
	 */
	private async handleRecordMatch(request: Request): Promise<Response> {
		const body = await request.json<{
			requestId: string;
			candidateUser: string;
			reason: string;
		}>();

		if (!body.requestId || !body.candidateUser) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Create match record
		const match: Match = {
			id: crypto.randomUUID(),
			requestId: body.requestId,
			candidateUser: body.candidateUser,
			reason: body.reason || '',
			createdAt: new Date().toISOString(),
		};

		// Add to matches array
		this.matches.unshift(match);

		// Save to storage
		await this.saveState();

		return new Response(JSON.stringify(match), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	/**
	 * Handle POST /clear - Clear all shifts and matches
	 */
	private async handleClear(request: Request): Promise<Response> {
		// Clear all data
		this.posts = [];
		this.matches = [];

		// Save empty state
		await this.saveState();

		return new Response(JSON.stringify({ 
			success: true, 
			message: 'All shifts and matches cleared' 
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract JSON from a string that may contain markdown or extra text
 * Useful for parsing LLM responses that wrap JSON in markdown code blocks
 */
function extractJson(text: string): any {
	// Try to parse as-is first
	try {
		return JSON.parse(text);
	} catch {}

	// Try to extract JSON from markdown code block
	const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
	if (codeBlockMatch) {
		try {
			return JSON.parse(codeBlockMatch[1]);
		} catch {}
	}

	// Try to find any JSON object in the text
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		try {
			return JSON.parse(jsonMatch[0]);
		} catch {}
	}

	// If all else fails, return null
	return null;
}

/**
 * Add CORS headers to a response
 */
function corsHeaders(origin: string = '*'): Record<string, string> {
	return {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	};
}

/**
 * Create a JSON response with CORS headers
 */
function jsonResponse(data: any, status: number = 200, corsOrigin: string = '*'): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders(corsOrigin),
		},
	});
}

// ============================================================================
// AI PROMPT TEMPLATES
// ============================================================================

/**
 * System prompt for the AI scheduling assistant
 * Defines the role, constraints, and preferences for matching
 */
const SYSTEM_PROMPT = `You are an intelligent scheduling assistant helping staff find shift swap matches. Your goal is to suggest the best candidate from the available pool who can cover a shift.

MATCHING PREFERENCES (in order of priority):
1. Same role - Prefer candidates with the same role as the requester
2. Proximate dates - Prefer swaps where dates are close to each other
3. Shift compatibility - Consider shift times and duration
4. Minimal disruption - Avoid creating cascading scheduling issues

CONSTRAINTS:
- Only suggest candidates from the provided pool
- Be realistic about role requirements
- Consider the notes provided by both parties
- If no good match exists, be honest about it

OUTPUT FORMAT:
You MUST respond with valid JSON only, in this exact format:
{
  "candidateUser": "Name of the suggested candidate",
  "reason": "Clear explanation of why this is the best match (1-2 sentences)"
}

Do not include any other text, markdown, or formatting. Return only the JSON object.`;

/**
 * Build the user prompt for requesting a match
 */
function buildMatchPrompt(targetPost: ShiftPost, candidatePool: ShiftPost[]): string {
	return `SHIFT SWAP REQUEST:
User "${targetPost.user}" (${targetPost.role}) needs someone to cover their shift:
- Date: ${targetPost.date}
- Shift: ${targetPost.shift}
- Notes: ${targetPost.notes || 'None'}

AVAILABLE CANDIDATES:
${candidatePool.map((post, idx) => `${idx + 1}. ${post.user} (${post.role})
   - Available: ${post.date}, ${post.shift}
   - Notes: ${post.notes || 'None'}`).join('\n\n')}

Analyze the request and candidates, then suggest the best match. Consider role compatibility, date proximity, and any relevant notes. Return your response as JSON with candidateUser and reason fields.`;
}

// ============================================================================
// WORKER: Main Request Handler
// ============================================================================

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const corsOrigin = env.CORS_ALLOW_ORIGIN || '*';

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: corsHeaders(corsOrigin),
			});
		}

		try {
			// Get or create the ShiftRoom Durable Object
			const id = env.SHIFT_ROOM.idFromName('global-room');
			const room = env.SHIFT_ROOM.get(id);

			// ============================================================
			// API ROUTES
			// ============================================================

			// POST /api/post - Create a new shift post
			if (path === '/api/post' && request.method === 'POST') {
				const response = await room.fetch(new Request('http://internal/post', {
					method: 'POST',
					body: await request.text(),
					headers: { 'Content-Type': 'application/json' },
				}));

				const data = await response.json();
				return jsonResponse(data, response.status, corsOrigin);
			}

			// GET /api/list - List all open shifts
			if (path === '/api/list' && request.method === 'GET') {
				const response = await room.fetch(new Request('http://internal/list', {
					method: 'GET',
				}));

				const data = await response.json();
				return jsonResponse(data, response.status, corsOrigin);
			}

			// POST /api/match - Request AI match suggestion
			if (path === '/api/match' && request.method === 'POST') {
				const body = await request.json<MatchRequest>();

				if (!body.requestId) {
					return jsonResponse({ error: 'Missing requestId' }, 400, corsOrigin);
				}

				// Fetch the target post
				const postResponse = await room.fetch(new Request(
					`http://internal/getPost?id=${body.requestId}`,
					{ method: 'GET' }
				));

				if (!postResponse.ok) {
					return jsonResponse({ error: 'Post not found' }, 404, corsOrigin);
				}

				const targetPost = await postResponse.json<ShiftPost>();

				// Fetch all open posts (candidate pool)
				const listResponse = await room.fetch(new Request('http://internal/list', {
					method: 'GET',
				}));

				const allPosts = await listResponse.json<ShiftPost[]>();

				// Filter out the target post itself
				const candidatePool = allPosts.filter(p => p.id !== targetPost.id);

				if (candidatePool.length === 0) {
					return jsonResponse({
						error: 'No available candidates in the pool',
						candidateUser: null,
						reason: 'There are currently no other open shifts to swap with.',
					}, 200, corsOrigin);
				}

				// Build AI prompt
				const userPrompt = buildMatchPrompt(targetPost, candidatePool);

				// Call Workers AI
				let aiResponse: any;
				try {
					aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
						messages: [
							{ role: 'system', content: SYSTEM_PROMPT },
							{ role: 'user', content: userPrompt },
						],
						max_tokens: 500,
						temperature: 0.7,
					});
				} catch (aiError) {
					console.error('AI call failed:', aiError);
					
					// Fallback: simple heuristic matching
					const fallbackMatch = candidatePool.find(c => c.role === targetPost.role) || candidatePool[0];
					
					return jsonResponse({
						candidateUser: fallbackMatch.user,
						reason: `AI unavailable. Matched based on role similarity (${fallbackMatch.role}).`,
						fallback: true,
					}, 200, corsOrigin);
				}

			// Parse AI response
			let aiText: string;
			if (typeof aiResponse === 'string') {
				aiText = aiResponse;
			} else if (aiResponse?.response) {
				aiText = typeof aiResponse.response === 'string' ? aiResponse.response : JSON.stringify(aiResponse.response);
			} else {
				aiText = JSON.stringify(aiResponse);
			}
			const matchData = extractJson(aiText);

				if (!matchData || !matchData.candidateUser) {
					// Fallback to first candidate
					const fallbackMatch = candidatePool[0];
					return jsonResponse({
						candidateUser: fallbackMatch.user,
						reason: 'AI response unclear. This is the first available candidate.',
						fallback: true,
					}, 200, corsOrigin);
				}

				// Record the match
				await room.fetch(new Request('http://internal/recordMatch', {
					method: 'POST',
					body: JSON.stringify({
						requestId: targetPost.id,
						candidateUser: matchData.candidateUser,
						reason: matchData.reason,
					}),
					headers: { 'Content-Type': 'application/json' },
				}));

				// Return match suggestion
				return jsonResponse({
					candidateUser: matchData.candidateUser,
					reason: matchData.reason,
					requestId: targetPost.id,
				}, 200, corsOrigin);
			}

			// POST /api/parse-chat - Parse natural language into shift data
			if (path === '/api/parse-chat' && request.method === 'POST') {
				const body = await request.json<{ message: string }>();

				if (!body.message) {
					return jsonResponse({ error: 'Missing message' }, 400, corsOrigin);
				}

				// Build prompt for parsing natural language
				const parsePrompt = `You are a shift scheduling assistant. Parse the following message into structured shift data.

User message: "${body.message}"

Extract the following information:
- user: The person's name (required)
- role: Their job role like Nurse, Doctor, Instructor (required)
- date: The shift date in YYYY-MM-DD format (required)
- shift: The time range like "09:00-17:00" (required)
- notes: Any additional information (optional)

If the message doesn't contain all required information, respond with:
{ "reply": "I need more information. Please provide: [missing fields]" }

If you can extract the data, respond with:
{ "shiftData": { "user": "name", "role": "role", "date": "YYYY-MM-DD", "shift": "HH:MM-HH:MM", "notes": "notes" } }

Respond ONLY with valid JSON. No other text.`;

				try {
					const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
						messages: [
							{ role: 'system', content: 'You are a helpful shift scheduling assistant. Always respond with valid JSON only.' },
							{ role: 'user', content: parsePrompt },
						],
						max_tokens: 300,
						temperature: 0.3, // Lower temperature for more consistent parsing
					});

					let aiText: string;
					if (typeof aiResponse === 'string') {
						aiText = aiResponse;
					} else if (aiResponse?.response) {
						aiText = typeof aiResponse.response === 'string' ? aiResponse.response : JSON.stringify(aiResponse.response);
					} else {
						aiText = JSON.stringify(aiResponse);
					}

					const parsed = extractJson(aiText);

					if (parsed && (parsed.shiftData || parsed.reply)) {
						return jsonResponse(parsed, 200, corsOrigin);
					} else {
						return jsonResponse({
							reply: 'Could you provide more details? I need your name, role, date, and time.'
						}, 200, corsOrigin);
					}
				} catch (error) {
					console.error('Chat parsing error:', error);
					return jsonResponse({
						reply: 'I had trouble understanding that. Please use the manual form below.'
					}, 200, corsOrigin);
				}
			}

			// POST /api/clear - Clear all shifts (for resetting demo data)
			if (path === '/api/clear' && request.method === 'POST') {
				const response = await room.fetch(new Request('http://internal/clear', {
					method: 'POST',
				}));

				const data = await response.json();
				return jsonResponse(data, response.status, corsOrigin);
			}

			// POST /api/intelligent-match - Intelligent matching with contextual understanding
			if (path === '/api/intelligent-match' && request.method === 'POST') {
			const body = await request.json<{
				message: string;
				currentUser: string;
				currentRole: string;
				userSchedule?: string;
			}>();

				if (!body.message) {
					return jsonResponse({ error: 'Missing message' }, 400, corsOrigin);
				}

				try {
					console.log('[Intelligent Match] Step 1: Analyzing intent for:', body.currentUser);
					console.log('[Intelligent Match] Message:', body.message);

					// STEP 1: Determine intent using AI
					const intentPrompt = `Analyze this message and determine the user's intent:

Message: "${body.message}"

Is the user:
A) SEEKING coverage (they can't work their shift and need someone to cover)
B) OFFERING to cover (they're available and can work shifts for others)

Respond with ONLY this JSON format:
{
  "intent": "seeking" or "offering",
  "confidence": "high" or "medium" or "low"
}

Examples:
- "I need Friday covered" → {"intent": "seeking", "confidence": "high"}
- "I'm available Thursday" → {"intent": "offering", "confidence": "high"}
- "Can't make my shift tomorrow" → {"intent": "seeking", "confidence": "high"}
- "I can work this weekend" → {"intent": "offering", "confidence": "high"}
- "Looking for coverage" → {"intent": "seeking", "confidence": "high"}
- "Available to cover" → {"intent": "offering", "confidence": "high"}

Respond with ONLY valid JSON.`;

					const intentResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
						messages: [
							{ role: 'system', content: 'You are an intent classifier. Always respond with valid JSON only.' },
							{ role: 'user', content: intentPrompt },
						],
						max_tokens: 100,
						temperature: 0.1, // Very low for consistent classification
					});

					let intentText: string;
					if (typeof intentResponse === 'string') {
						intentText = intentResponse;
					} else if (intentResponse?.response) {
						intentText = typeof intentResponse.response === 'string' ? intentResponse.response : JSON.stringify(intentResponse.response);
					} else {
						intentText = JSON.stringify(intentResponse);
					}

					const intent = extractJson(intentText);
					console.log('[Intelligent Match] Intent detected:', intent?.intent || 'unknown');

					if (!intent || !intent.intent) {
						return jsonResponse({
							needsMoreInfo: true,
							message: 'I\'m not sure if you\'re looking for coverage or offering to cover. Could you be more specific?'
						}, 200, corsOrigin);
					}

				// STEP 2: Extract details based on intent
				const scheduleInfo = body.userSchedule ? `\n\nUser's Existing Shifts:\n${body.userSchedule}\n\nIMPORTANT: If the user mentions "my shift" on a specific date, use the EXACT time from their schedule above!` : '';
				
				const extractPrompt = `Extract shift details from this message:

User: ${body.currentUser}
Current Role: ${body.currentRole}
Message: "${body.message}"
Intent: User is ${intent.intent === 'seeking' ? 'looking for someone to cover their shift' : 'offering to cover shifts for others'}${scheduleInfo}

Extract:
- date: Convert to YYYY-MM-DD format. "Friday" = next Friday, "tomorrow" = tomorrow's date, etc.
- shift: Time range like "09:00-17:00". **If they mention "my shift" on a date, look in their existing shifts and use that EXACT time!** Otherwise if they say "morning" use "08:00-12:00", "afternoon" use "13:00-17:00", "evening" use "17:00-21:00"
- role: Their job role (use "${body.currentRole}" if not specified)
- notes: Any additional context

If critical information is MISSING (especially date or time), respond:
{
  "needsMoreInfo": true,
  "message": "What specific date and time?"
}

If you have enough info:
{
  "needsMoreInfo": false,
  "shiftData": {
    "date": "YYYY-MM-DD",
    "shift": "HH:MM-HH:MM",
    "role": "role name",
    "notes": "any notes"
  }
}

Respond with ONLY valid JSON.`;

					const extractResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
						messages: [
							{ role: 'system', content: 'You are a data extraction assistant. Always respond with valid JSON only.' },
							{ role: 'user', content: extractPrompt },
						],
						max_tokens: 300,
						temperature: 0.2,
					});

					let extractText: string;
					if (typeof extractResponse === 'string') {
						extractText = extractResponse;
					} else if (extractResponse?.response) {
						extractText = typeof extractResponse.response === 'string' ? extractResponse.response : JSON.stringify(extractResponse.response);
					} else {
						extractText = JSON.stringify(extractResponse);
					}

					const extracted = extractJson(extractText);
					console.log('[Intelligent Match] Extraction result:', extracted);

					if (!extracted || extracted.needsMoreInfo) {
						return jsonResponse({
							needsMoreInfo: true,
							message: extracted?.message || 'Could you provide the specific date and time?'
						}, 200, corsOrigin);
					}

					// STEP 3: Handle based on intent
					if (intent.intent === 'offering') {
						// User is offering to cover - CREATE a new shift entry
						const shiftData = extracted.shiftData;
						const postResponse = await room.fetch(new Request('http://internal/post', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								user: body.currentUser,
								role: shiftData.role || body.currentRole,
								date: shiftData.date,
								shift: shiftData.shift,
								notes: `Available to cover${shiftData.notes ? ' | ' + shiftData.notes : ''}`,
							}),
						}));

						const createdPost = await postResponse.json();
						console.log('[Intelligent Match] Created availability post:', createdPost.id);

						// NOW CHECK IF ANYONE IS SEEKING COVERAGE ON THIS DATE
						const shiftsResponse = await room.fetch(new Request('http://internal/list'));
						const allShifts = await shiftsResponse.json();
						
						console.log('[Intelligent Match] Checking for existing coverage requests...');

						// Find people seeking coverage (not the current user)
						const matchingRequests = allShifts.filter((s: any) => {
							// Filter out the current user and their own post
							if (s.user === body.currentUser) return false;
							if (s.id === createdPost.id) return false;
							
							// Look for "seeking" shifts (Seeking coverage)
							if (!s.notes || !s.notes.includes('Seeking coverage')) return false;
							
							// Check if dates match or are close
							const offerDate = new Date(shiftData.date);
							const requestDate = new Date(s.date);
							const daysDiff = Math.abs((offerDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
							
							return daysDiff <= 3; // Within 3 days
						});

						console.log('[Intelligent Match] Found', matchingRequests.length, 'matching coverage requests');

						if (matchingRequests.length === 0) {
							return jsonResponse({
								needsMoreInfo: false,
								action: 'created',
								message: `Perfect! I've recorded that you're available to cover shifts on ${shiftData.date} from ${shiftData.shift}.`,
								suggestion: 'When someone needs coverage for that time, they\'ll be matched with you!',
								matches: [],
								shift: createdPost
							}, 200, corsOrigin);
						}

						// Sort by best match (same role, closest date, exact date first)
						matchingRequests.sort((a: any, b: any) => {
							const aDate = new Date(a.date);
							const bDate = new Date(b.date);
							const offerDate = new Date(shiftData.date);
							
							const aDiff = Math.abs((offerDate.getTime() - aDate.getTime()) / (1000 * 60 * 60 * 24));
							const bDiff = Math.abs((offerDate.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24));
							
							// Prefer exact date matches
							if (aDiff === 0 && bDiff !== 0) return -1;
							if (bDiff === 0 && aDiff !== 0) return 1;
							
							// Then prefer same role
							const aRoleMatch = a.role === (shiftData.role || body.currentRole);
							const bRoleMatch = b.role === (shiftData.role || body.currentRole);
							if (aRoleMatch && !bRoleMatch) return -1;
							if (bRoleMatch && !aRoleMatch) return 1;
							
							// Then by date proximity
							return aDiff - bDiff;
						});

						const matches = matchingRequests.slice(0, 3).map((s: any) => {
							const requestDate = new Date(s.date);
							const offerDate = new Date(shiftData.date);
							const daysDiff = Math.abs((offerDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
							
							let reason = '';
							if (daysDiff === 0) {
								if (s.role === (shiftData.role || body.currentRole)) {
									reason = `🎯 Perfect match! Same role (${s.role}) and same date (${s.date})!`;
								} else {
									reason = `Same date (${s.date}) but different role (${s.role} vs your ${shiftData.role || body.currentRole})`;
								}
							} else {
								reason = `${s.role === (shiftData.role || body.currentRole) ? 'Same role' : 'Different role'}, ${daysDiff} day${daysDiff > 1 ? 's' : ''} apart`;
							}
							
							return {
								user: s.user,
								role: s.role,
								date: s.date,
								shift: s.shift,
								reason
							};
						});

						return jsonResponse({
							needsMoreInfo: false,
							action: 'created',
							message: `Great! I've recorded your availability for ${shiftData.date} from ${shiftData.shift}.`,
							summary: `🎉 Good news! I found ${matches.length} ${matches.length > 1 ? 'people who need' : 'person who needs'} coverage around that time:`,
							matches,
							suggestion: matches.length > 0 ? 'Would you like to cover any of these shifts?' : '',
							shift: createdPost
						}, 200, corsOrigin);

					} else {
						// User is seeking coverage - CREATE a coverage request post
						const shiftData = extracted.shiftData;
						const postResponse = await room.fetch(new Request('http://internal/post', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								user: body.currentUser,
								role: shiftData.role || body.currentRole,
								date: shiftData.date,
								shift: shiftData.shift,
								notes: `Seeking coverage${shiftData.notes ? ' | ' + shiftData.notes : ''}`,
							}),
						}));

						const createdPost = await postResponse.json();
						console.log('[Intelligent Match] Created coverage request:', createdPost.id);

						// Now check if anyone is available (offering) for that time
						const shiftsResponse = await room.fetch(new Request('http://internal/list'));
						const allShifts = await shiftsResponse.json();
						
						console.log('[Intelligent Match] Searching', allShifts.length, 'shifts for matches');

						// Find people offering coverage (not the current user, not themselves)
						const matchingShifts = allShifts.filter((s: any) => {
							// Filter out the current user and their own request
							if (s.user === body.currentUser) return false;
							if (s.id === createdPost.id) return false;
							
							// Look for "offering" shifts (Available to cover)
							if (!s.notes || !s.notes.includes('Available to cover')) return false;
							
							// Check if dates match or are close
							const targetDate = new Date(shiftData.date);
							const shiftDate = new Date(s.date);
							const daysDiff = Math.abs((targetDate.getTime() - shiftDate.getTime()) / (1000 * 60 * 60 * 24));
							
							return daysDiff <= 3; // Within 3 days
						});

						if (matchingShifts.length === 0) {
							return jsonResponse({
								needsMoreInfo: false,
								action: 'posted',
								matches: [],
								message: `Your coverage request for ${shiftData.date} has been posted! I'll let you know when someone offers to cover.`,
								suggestion: `Your shift is now visible to others. When someone posts availability for that time, you'll see them in the calendar.`,
								shift: createdPost
							}, 200, corsOrigin);
						}

						// Sort by best match (same role, closest date)
						const matches = matchingShifts.slice(0, 3).map((s: any) => ({
							user: s.user,
							role: s.role,
							date: s.date,
							shift: s.shift,
							reason: s.role === (shiftData.role || body.currentRole) 
								? `Same role (${s.role}) and available on ${s.date}!` 
								: `Available on ${s.date}, different role but might help`
						}));

						return jsonResponse({
							needsMoreInfo: false,
							action: 'posted',
							summary: `Great news! I found ${matches.length} ${matches.length > 1 ? 'people' : 'person'} available to cover your shift`,
							matches,
							shift: createdPost
						}, 200, corsOrigin);
					}

			} catch (error) {
				console.error('[Intelligent Match] Error:', error);
				return jsonResponse({
					error: 'Failed to process request',
					message: error instanceof Error ? error.message : String(error),
				}, 500, corsOrigin);
			}
		}

			// ============================================================
			// SERVE STATIC SITE
			// ============================================================

			// For root path, serve index.html
			if (path === '/' || path === '/index.html') {
				// In development with wrangler dev, static assets are served automatically
				// This is a fallback for production
				return new Response('Please ensure site.bucket is configured in wrangler.toml', {
					status: 200,
					headers: { 'Content-Type': 'text/html' },
				});
			}

			return jsonResponse({ error: 'Not Found' }, 404, corsOrigin);

		} catch (error) {
			console.error('Worker error:', error);
			return jsonResponse({
				error: 'Internal server error',
				message: error instanceof Error ? error.message : String(error),
			}, 500, corsOrigin);
		}
	},
};

