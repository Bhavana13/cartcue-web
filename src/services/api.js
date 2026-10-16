// Add this to your existing src/services/api.js
export async function createStorefrontSession(sessionData) {
  console.log(`[API Client] POST /sessions - Sending session data:`, sessionData);
  
  try {
    const res = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[API Client] POST /sessions failed with status ${res.status}:`, errorText);
      throw new Error(`Failed to create session: ${res.statusText}`);
    }

    const data = await res.json();
    console.log(`[API Client] POST /sessions success:`, data);
    return data;
  } catch (error) {
    console.error(`[API Client] Network or parsing error during POST /sessions:`, error);
    throw error;
  }
}