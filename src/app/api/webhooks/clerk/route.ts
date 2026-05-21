import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Get the Svix webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Handle the webhook event
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "user.created": {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email: email_addresses[0]?.email_address ?? "",
            name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || undefined,
            imageUrl: image_url,
          },
          create: {
            clerkId: id,
            email: email_addresses[0]?.email_address ?? "",
            name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || undefined,
            imageUrl: image_url,
          },
        });

        console.log(`✅ User created/updated: ${id}`);
        break;
      }

      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: email_addresses[0]?.email_address ?? "",
            name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || undefined,
            imageUrl: image_url,
          },
        });

        console.log(`✅ User updated: ${id}`);
        break;
      }

      case "user.deleted": {
        const { id } = evt.data;
        if (id) {
          await prisma.user.delete({ where: { clerkId: id } });
          console.log(`✅ User deleted: ${id}`);
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${eventType}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}