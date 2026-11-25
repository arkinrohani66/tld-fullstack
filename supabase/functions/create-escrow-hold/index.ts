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

const CLIENT_ERRORS = new Set([
  "NOT_AUTHENTICATED",
  "INVALID_CARGO",
  "INVALID_AMOUNT",
  "INVALID_DRIVER",
  "ESCROW_ALREADY_OPEN",
]);

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
    const driverId = typeof body?.driverId === "string" ? body.driverId : null;
    const freight = Number(body?.freightAmountTomans);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await serviceClient.rpc("create_escrow_hold", {
      p_actor_id: userData.user.id,
      p_cargo_id: cargoId,
      p_driver_id: driverId,
      p_freight_amount_tomans: Number.isFinite(freight) ? freight : null,
    });

    if (error) {
      const code = CLIENT_ERRORS.has(error.message) ? error.message : null;
      if (code) return json({ error: code }, 400);
      console.error("create_escrow_hold failed", error);
      return json({ error: "SERVER_ERROR" }, 500);
    }

    return json(data);
  } catch (err) {
    console.error("create-escrow-hold failed", err);
    return json({ error: "SERVER_ERROR" }, 500);
  }
});
