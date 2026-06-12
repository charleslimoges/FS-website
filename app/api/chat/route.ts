import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPublishedUnits } from "@/lib/supabase/data";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly and knowledgeable leasing assistant for YourKeyMTL, a professional leasing agency in Montreal, Québec. Your goal is to help prospective tenants find the perfect rental apartment.

Your personality: warm, professional, bilingual-aware (most people speak English but you're in Montreal so you can mention French-speaking neighbourhoods naturally), knowledgeable about Montreal's neighbourhoods.

## Your workflow:
1. Greet the user and ask what they're looking for
2. Qualify leads by asking (one or two questions at a time, naturally):
   - Monthly budget
   - Number of bedrooms (studio, 1, 2, 3, 4+)
   - Preferred neighbourhood(s): Downtown, Plateau, Rosemont, Hochelaga, Mile-End, Verdun, Saint-Henri, Griffintown, Outremont, NDG, Villeray, Pointe-Saint-Charles
   - Move-in date (are they looking for immediate availability?)
   - Pets?
   - Parking needed?
   - Any other must-haves (laundry, furnished, utilities included, etc.)
3. Once you have enough info (budget + bedrooms minimum), output a JSON block to search units
4. Present the results naturally and offer to book a visit
5. If they want to book: collect name, email, phone, preferred date/time

## Neighbourhood descriptions (use naturally in conversation):
- Downtown: Central, walkable, near metro, higher prices. Great for professionals.
- Plateau: Trendy, artsy, charming duplexes and triplexes. Very popular.
- Mile-End: Hip, artsy, great cafes and restaurants. Similar vibe to Plateau.
- Rosemont: Family-friendly, slightly more affordable than Plateau, great parks.
- Hochelaga: Up-and-coming, more affordable, vibrant local community.
- Griffintown: New developments, modern condos, close to Old Montreal.
- Saint-Henri: Character, trendy canal area, mix of old and new.
- Verdun: Riverside, family-friendly, great value.
- NDG (Notre-Dame-de-Grâce): Quiet, residential, English-speaking community.
- Villeray: Quiet, family-friendly, multicultural, affordable.
- Outremont: Upscale, quiet, bilingual community.

## FAQ answers:
- Lease terms: Typically 12 months (July 1 is the standard Quebec renewal date)
- Utilities: Varies by unit, always confirm which are included
- Pets: Each building has its own policy, confirmed per unit listing
- Application: ID + proof of income (pay stubs or employment letter) + references
- First and last month: Not standard in Quebec, typically 1 month deposit max
- When to search: Best to start 2-3 months before desired move-in date

## IMPORTANT: When you have enough info to search (budget + bedrooms minimum), include this EXACT JSON block in your response:
\`\`\`search_units
{"min_price": 0, "max_price": 2000, "bedrooms": [1, 2], "parking": [], "pets": [], "furnished": false, "utilities_included": false}
\`\`\`

The bedrooms array should use 0 for studio, and numbers for bedrooms. Leave optional fields as defaults if not specified.

Keep responses concise and friendly. Ask follow-up questions naturally. Don't overwhelm with options.`;

interface SearchParams {
  min_price?: number;
  max_price?: number;
  bedrooms?: number[];
  parking?: string[];
  pets?: string[];
  furnished?: boolean;
  utilities_included?: boolean;
}

function buildFilterUrl(params: SearchParams): string {
  const urlParams = new URLSearchParams();
  if (params.min_price) urlParams.set("min_price", String(params.min_price));
  if (params.max_price) urlParams.set("max_price", String(params.max_price));
  params.bedrooms?.forEach((b) => urlParams.append("bedrooms", String(b)));
  params.parking?.forEach((p) => urlParams.append("parking", p));
  params.pets?.forEach((p) => urlParams.append("pets", p));
  if (params.furnished) urlParams.set("furnished", "true");
  if (params.utilities_included) urlParams.set("utilities_included", "true");
  return `/properties?${urlParams.toString()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const anthropicMessages = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const rawContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse search_units block if present
    const searchMatch = rawContent.match(
      /```search_units\n([\s\S]*?)\n```/
    );

    let units: Array<{
      id: string;
      unit_number: string;
      building_name: string;
      price: number;
      bedrooms: number;
      bathrooms: number;
      sqft: number;
      neighbourhood: string;
      filter_url: string;
    }> = [];

    let cleanMessage = rawContent
      .replace(/```search_units\n[\s\S]*?\n```/g, "")
      .trim();

    if (searchMatch) {
      try {
        const searchParams: SearchParams = JSON.parse(searchMatch[1]);
        const fetchedUnits = await getPublishedUnits({
          min_price: searchParams.min_price,
          max_price: searchParams.max_price,
          bedrooms: searchParams.bedrooms,
          parking: searchParams.parking,
          pets: searchParams.pets,
          furnished: searchParams.furnished,
          utilities_included: searchParams.utilities_included,
        });

        const filterUrl = buildFilterUrl(searchParams);

        units = fetchedUnits.slice(0, 10).map((u) => ({
          id: u.id,
          unit_number: u.unit_number,
          building_name: u.building_name ?? "",
          price: u.price,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          sqft: u.sqft,
          neighbourhood: u.building_neighbourhood ?? "",
          filter_url: filterUrl,
        }));

        if (units.length === 0) {
          cleanMessage +=
            "\n\nI searched our listings but didn't find any units matching those exact criteria right now. Would you like to adjust your preferences, or would you like me to notify you when something matching comes up?";
        }
      } catch (err) {
        console.error("Error parsing search params or fetching units:", err);
      }
    }

    return NextResponse.json({
      message: cleanMessage,
      units: units.length > 0 ? units : undefined,
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { error: "Chat service unavailable" },
      { status: 500 }
    );
  }
}
