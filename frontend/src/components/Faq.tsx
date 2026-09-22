const FAQ_ITEMS = [
  {
    question: "How do I report an outage?",
    answer:
      "Sign in, open the Map, click your location (or use current location), choose electricity, internet, or water, then submit. Nearby reports are grouped into one incident.",
  },
  {
    question: "What do Unverified, Possible, Likely, and Confirmed mean?",
    answer:
      "Confidence rises as more people report or confirm the same outage, or when monitoring agents in that area fail together. Confirmed is the strongest signal.",
  },
  {
    question: "Do I need a Google Maps key?",
    answer:
      "No. The map uses OpenStreetMap (Arabic/local names) and Esri tiles (English). Switch language with EN / العربية on the map.",
  },
  {
    question: "Who can mark Service is back?",
    answer:
      "Only someone who submitted a report for that outage. Other signed-in users can confirm it is happening, but they cannot close it.",
  },
  {
    question: "Can I add a photo to my profile?",
    answer:
      "Yes. Sign in, open Profile from the menu, then tap the camera on your avatar. You can also set a display name, neighborhood, and a short note.",
  },
  {
    question: "Why didn’t Use my current location work on my phone?",
    answer:
      "Phones only share GPS on HTTPS. Open https:// followed by this computer’s Wi‑Fi address and port 5173 (for example https://192.168.10.203:5173). Accept the certificate warning, allow location, then try again. You can also tap the map to drop a pin.",
  },
  {
    question: "Why must my pin be in Lebanon?",
    answer:
      "CedarWatch only tracks infrastructure inside Lebanon. Reports outside that area are rejected.",
  },
];

export function Faq() {
  return (
    <section className="panel p-5">
      <p className="stamp text-[var(--cedar-green)]">Field notes</p>
      <h2 className="font-display mt-2 text-2xl text-[var(--cedar-dark)]">Help</h2>
      <p className="mt-1 text-sm text-stone-600">
        Short answers. No chatbot — this stays accurate even when the network is
        bad.
      </p>
      <div className="mt-4 divide-y divide-slate-100">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group py-3">
            <summary className="min-h-11 cursor-pointer list-none py-1 text-sm font-medium text-[var(--cedar-dark)] [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span className="text-slate-400 group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
