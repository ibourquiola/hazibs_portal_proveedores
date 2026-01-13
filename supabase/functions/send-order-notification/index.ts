import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  userEmail: string;
  offerNumber: string;
  offerDescription: string;
  units: number;
  term: string;
  priceEuros: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userEmail, 
      offerNumber, 
      offerDescription,
      units, 
      term, 
      priceEuros 
    }: OrderNotificationRequest = await req.json();

    if (!userEmail || !offerNumber) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formattedPrice = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(priceEuros);

    const formattedUnits = new Intl.NumberFormat("es-ES").format(units);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portal Proveedores <onboarding@resend.dev>",
        to: [userEmail],
        subject: `Nuevo pedido generado - Oferta ${offerNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">¡Nuevo Pedido Generado!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin-top: 0;">Se ha generado un nuevo pedido a partir de tu aplicación. A continuación encontrarás el resumen:</p>
              
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h2 style="margin-top: 0; color: #6366f1; font-size: 18px;">Oferta ${offerNumber}</h2>
                <p style="color: #64748b; margin-bottom: 20px;">${offerDescription}</p>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Unidades</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formattedUnits}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Plazo</td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${term}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #64748b;">Precio</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #6366f1; font-size: 18px;">${formattedPrice}</td>
                  </tr>
                </table>
              </div>
              
              <p style="margin-bottom: 0;">Por favor, accede al portal para verificar y confirmar el pedido.</p>
            </div>
            
            <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #94a3b8; margin: 0; font-size: 14px;">Portal de Proveedores</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
