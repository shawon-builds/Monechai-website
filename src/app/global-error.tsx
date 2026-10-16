"use client";

export default function GlobalError({ retry }: { error: Error; retry: () => void }) {
  // Root recovery must not depend on the failed layout, database or external fonts.
  return <html lang="en"><body style={{ margin: 0, padding: "48px 24px", fontFamily: "system-ui", background: "#faf9f7", color: "#242322" }}>
    <main role="alert"><h1>The store is temporarily unavailable</h1><p>Please try again. Your order is confirmed only when you receive its saved reference.</p>
      <p lang="bn">দোকানটি সাময়িকভাবে বন্ধ আছে। আবার চেষ্টা করুন। অর্ডারের সংরক্ষিত নম্বর পেলেই অর্ডার নিশ্চিত হবে।</p>
      <button onClick={() => retry()}>Try again / আবার চেষ্টা করুন</button>
    </main>
  </body></html>;
}
