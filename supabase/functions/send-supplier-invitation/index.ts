import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  supplierName: string;
  invitationToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, supplierName, invitationToken }: InvitationRequest = 
      await req.json();

    if (!email || !firstName || !invitationToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the base URL from the Supabase URL or use a default
    const baseUrl = SUPABASE_URL?.replace('.supabase.co', '') || '';
    const portalUrl = `${req.headers.get('origin') || 'https://portal.example.com'}/setup-password?token=${invitationToken}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portal Proveedores <onboarding@resend.dev>",
        to: [email],
        subject: `Invitación al Portal de Proveedores - ${supplierName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">¡Bienvenido al Portal de Proveedores!</h1>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <p style="margin-top: 0;">Hola <strong>${firstName} ${lastName}</strong>,</p>
              
              <p>Has sido invitado a unirte al Portal de Proveedores como representante de <strong>${supplierName}</strong>.</p>
              
              <p>Para comenzar, haz clic en el siguiente botón para configurar tu contraseña y acceder al portal:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Configurar mi cuenta
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; font-size: 12px; color: #6366f1;">${portalUrl}</p>
              
              <p style="margin-bottom: 0; color: #64748b; font-size: 14px;">Este enlace es válido durante 7 días.</p>
            </div>
            
            <div style="background: #1e293b; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="color: #94a3b8; margin: 0; font-size: 14px;">Portal de Proveedores - Hazi Business Solutions</p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      return new Response(
        JSON.stringify({ error: emailData.message || "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Invitation email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-supplier-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
