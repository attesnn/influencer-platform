"use client";

import { FormEvent, useState } from "react";

export function AgencyActions({ influencerIds }: { influencerIds: string[] }) {
  const [status, setStatus] = useState<string>("");

  async function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name")),
      budgetRange: String(formData.get("budgetRange")),
      targetGeo: String(formData.get("targetGeo")),
      targetNiche: String(formData.get("targetNiche")),
      minSubscribers: Number(formData.get("minSubscribers") || 0),
      minViews30d: Number(formData.get("minViews30d") || 0),
    };

    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus(response.ok ? "Campaign created." : "Campaign creation failed.");
  }

  async function sendOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      campaignId: String(formData.get("campaignId")),
      influencerUserId: String(formData.get("influencerUserId")),
      message: String(formData.get("message")),
      proposedValue: Number(formData.get("proposedValue")),
    };

    const response = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus(response.ok ? "Offer sent." : "Offer sending failed.");
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form className="rounded border p-4" onSubmit={createCampaign}>
        <h2 className="font-semibold">Create campaign</h2>
        <div className="mt-3 grid gap-2 text-sm">
          <input className="rounded border px-2 py-1" name="name" placeholder="Campaign name" required />
          <input className="rounded border px-2 py-1" name="budgetRange" placeholder="Budget range" required />
          <input className="rounded border px-2 py-1" name="targetGeo" placeholder="Target geo" required />
          <input className="rounded border px-2 py-1" name="targetNiche" placeholder="Target niche" required />
          <input className="rounded border px-2 py-1" name="minSubscribers" placeholder="Min subscribers" type="number" />
          <input className="rounded border px-2 py-1" name="minViews30d" placeholder="Min views (30d)" type="number" />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Save campaign
          </button>
        </div>
      </form>
      <form className="rounded border p-4" onSubmit={sendOffer}>
        <h2 className="font-semibold">Send offer request</h2>
        <div className="mt-3 grid gap-2 text-sm">
          <input className="rounded border px-2 py-1" name="campaignId" placeholder="Campaign ID" required />
          <select className="rounded border px-2 py-1" name="influencerUserId" required>
            <option value="">Select influencer</option>
            {influencerIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <textarea className="rounded border px-2 py-1" name="message" placeholder="Offer message" required />
          <input className="rounded border px-2 py-1" name="proposedValue" placeholder="EUR value" type="number" required />
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Send offer
          </button>
        </div>
      </form>
      {status ? <p className="text-sm">{status}</p> : null}
    </div>
  );
}
