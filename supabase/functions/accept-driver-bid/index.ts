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
  "CARGO_NOT_OPEN",
  "INVALID_BID",
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
    const bidId = typeof body?.bidId === "string" ? body.bidId : null;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await serviceClient.rpc("accept_driver_bid", {
      p_actor_id: userData.user.id,
      p_cargo_id: cargoId,
      p_bid_id: bidId,
    });

    if (error) {
      const code = CLIENT_ERRORS.has(error.message) ? error.message : null;
      if (code) return json({ error: code }, 400);
      console.error("accept_driver_bid failed", error);
      return json({ error: "SERVER_ERROR" }, 500);
    }

    return json(data);
  } catch (err) {
    console.error("accept-driver-bid failed", err);
    return json({ error: "SERVER_ERROR" }, 500);
  }
});
