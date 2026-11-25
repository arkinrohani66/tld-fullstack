import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const CLIENT_ERRORS = new Set(["NOT_AUTHENTICATED"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "NOT_AUTHENTICATED" }, 401);
    }

    const body = await req.json();
    const cargoId = typeof body?.cargoId === "string" ? body.cargoId : null;
    const otp = typeof body?.otp === "string" ? body.otp : null;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await serviceClient.rpc("confirm_delivery_and_settle", {
      p_actor_id: userData.user.id,
      p_cargo_id: cargoId,
      p_otp: otp,
    });

    if (error) {
      if (CLIENT_ERRORS.has(error.message)) return json({ error: error.message }, 401);
      console.error("confirm_delivery_and_settle failed", error);
      return json({ error: "SERVER_ERROR" }, 500);
    }

    return json(data);
  } catch (err) {
    console.error("confirm-delivery-and-settle failed", err);
    return json({ error: "SERVER_ERROR" }, 500);
  }
});
