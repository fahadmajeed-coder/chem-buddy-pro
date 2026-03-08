import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "generate_sop",
      description: "Generate a Standard Operating Procedure for a chemistry lab test or analysis method",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the SOP" },
          category: { type: "string", description: "Category (e.g., Proximate Analysis, Titration, Spectroscopy)" },
          principle: { type: "string", description: "Scientific principle behind the method" },
          apparatus: { type: "array", items: { type: "string" }, description: "List of equipment needed" },
          reagents: { type: "array", items: { type: "string" }, description: "List of reagents/chemicals needed" },
          procedure: { type: "array", items: { type: "string" }, description: "Step-by-step procedure" },
          calculations: { type: "string", description: "Calculation formulas used" },
          resultInterpretation: { type: "string", description: "How to interpret results" },
        },
        required: ["name", "category", "procedure"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_formula",
      description: "Generate a custom calculation formula for chemistry calculations",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the formula" },
          description: { type: "string", description: "What this formula calculates" },
          expression: { type: "string", description: "The mathematical expression using variable names. Use standard math: +, -, *, /, ^, sqrt(), log(), ln(), abs(). Use variable names like SampleWeight, Volume, Concentration." },
          variables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Variable name (no spaces, use camelCase)" },
                description: { type: "string", description: "What this variable represents" },
                defaultValue: { type: "string", description: "Default value or empty string" },
              },
              required: ["name", "description", "defaultValue"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "description", "expression", "variables"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_inventory_item",
      description: "Generate a chemical compound entry for the inventory with its properties",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full chemical name" },
          formula: { type: "string", description: "Chemical formula (e.g., NaCl, H2SO4, CuSO4·5H2O)" },
          molarMass: { type: "number", description: "Molar mass in g/mol" },
          nFactor: { type: "number", description: "n-factor for normality calculations (H+ for acids, OH- for bases, electrons for redox). Use null if not applicable." },
          purity: { type: "string", description: "Purity specification (e.g., '99.5%', '98-100%')" },
          density: { type: "number", description: "Density in g/mL. Use null if not known." },
        },
        required: ["name", "formula", "molarMass"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = type === "generate"
      ? `You are a chemistry lab assistant. When the user asks to generate, create, or add an SOP, formula, or chemical/inventory item, use the appropriate tool to generate structured data. Always use the tool — never respond with plain text for generation requests. Be thorough and scientifically accurate. For SOPs, include detailed step-by-step procedures. For formulas, use proper mathematical notation with variable names. For inventory items, include accurate molar masses and properties.`
      : `You are an expert chemistry assistant helping with lab work, calculations, and concepts. Keep answers clear, concise, and accurate. Use markdown formatting.`;

    const body: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    if (type === "generate") {
      body.tools = tools;
      body.tool_choice = "auto";
    } else {
      body.stream = true;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "generate") {
      const data = await response.json();
      const choice = data.choices?.[0];
      const toolCalls = choice?.message?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        const toolCall = toolCalls[0];
        const result = {
          type: toolCall.function.name,
          data: JSON.parse(toolCall.function.arguments),
          text: choice?.message?.content || "",
        };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // No tool call — return text
      return new Response(JSON.stringify({ type: "text", text: choice?.message?.content || "I couldn't generate that. Please try rephrasing." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chemistry-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
